import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Annotation2D,
  BridgeCommandToViewer,
  TelemetryReadout,
} from '../../types/stemverse';
import {
  createBenchSurfaceTexture,
  createContactShadowTexture,
} from '../materials/proceduralTextures';
import { buildExperimentScene } from '../scenes';
import { ActiveLabScene, RegisteredComponent } from '../scenes/sceneTypes';

const _projVec = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _worldAnchor = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export interface LabViewerHandle {
  sendCommand: (cmd: BridgeCommandToViewer) => void;
}

interface LabViewerCanvasProps {
  experimentId: string;
  initialParams: Record<string, number>;
  lightweightMode?: boolean;
  interactive?: boolean;
  showAnnotations?: boolean;
  selectedMeshKey?: string | null;
  onSelectComponent?: (meshKey: string | null) => void;
  onReadoutsChange?: (readouts: TelemetryReadout[]) => void;
  className?: string;
}

export const LabViewerCanvas = React.forwardRef<LabViewerHandle, LabViewerCanvasProps>(
  (
    {
      experimentId,
      initialParams,
      lightweightMode = false,
      interactive = true,
      showAnnotations = true,
      selectedMeshKey = null,
      onSelectComponent,
      onReadoutsChange,
      className = '',
    },
    ref
  ) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [annotations, setAnnotations] = useState<Annotation2D[]>([]);
    const [contextLost, setContextLost] = useState(false);

    // Mutable engine refs so UI state updates never tear down the WebGL context
    const stateRef = useRef({
      experimentId,
      params: { ...initialParams },
      playing: true,
      exploded: 0,
      showAnnotations,
      selectedMeshKey,
      lightweightMode,
      camTransitionActive: false,
      camGoalPos: new THREE.Vector3(0, 2.8, 5.2),
      camGoalTarget: new THREE.Vector3(0, 1.1, 0),
    });

    const callbacksRef = useRef({ onSelectComponent, onReadoutsChange });
    callbacksRef.current = { onSelectComponent, onReadoutsChange };

    const engineApiRef = useRef<{
      loadScene: (id: string, params: Record<string, number>) => void;
      resetCamera: () => void;
      setComponentVisibility: (meshKey: string, visible: boolean) => void;
      applySelectionHighlight: (meshKey: string | null) => void;
      applyLightweight: (enabled: boolean) => void;
    } | null>(null);

    const dispatchCommand = (cmd: BridgeCommandToViewer) => {
      const s = stateRef.current;
      switch (cmd.type) {
        case 'LOAD_EXPERIMENT':
          s.experimentId = cmd.experimentId;
          s.params = { ...cmd.params };
          s.exploded = 0;
          s.selectedMeshKey = null;
          engineApiRef.current?.loadScene(cmd.experimentId, s.params);
          break;
        case 'SET_PARAM':
          s.params[cmd.key] = cmd.value;
          break;
        case 'SET_PLAYING':
          s.playing = cmd.playing;
          break;
        case 'RESET_SIM':
          s.exploded = 0;
          s.playing = true;
          engineApiRef.current?.loadScene(s.experimentId, s.params);
          break;
        case 'SET_EXPLODED':
          s.exploded = cmd.amount;
          break;
        case 'TOGGLE_ANNOTATIONS':
          s.showAnnotations = cmd.visible;
          if (!cmd.visible) setAnnotations([]);
          break;
        case 'SET_COMPONENT_VISIBILITY':
          engineApiRef.current?.setComponentVisibility(cmd.meshKey, cmd.visible);
          break;
        case 'SELECT_COMPONENT':
          s.selectedMeshKey = cmd.meshKey;
          engineApiRef.current?.applySelectionHighlight(cmd.meshKey);
          break;
        case 'RESET_CAMERA':
          engineApiRef.current?.resetCamera();
          break;
        case 'SET_CAMERA_PRESET':
          s.camGoalPos.set(...cmd.position);
          s.camGoalTarget.set(...cmd.target);
          s.camTransitionActive = true;
          break;
        case 'SET_LIGHTWEIGHT_MODE':
          s.lightweightMode = cmd.enabled;
          engineApiRef.current?.applyLightweight(cmd.enabled);
          break;
      }
    };

    useImperativeHandle(ref, () => ({
      sendCommand: dispatchCommand,
    }));

    // Sync props to mutable ref
    useEffect(() => {
      stateRef.current.showAnnotations = showAnnotations;
      if (!showAnnotations) setAnnotations([]);
    }, [showAnnotations]);

    useEffect(() => {
      stateRef.current.selectedMeshKey = selectedMeshKey;
      engineApiRef.current?.applySelectionHighlight(selectedMeshKey ?? null);
    }, [selectedMeshKey]);

    useEffect(() => {
      stateRef.current.lightweightMode = lightweightMode;
      engineApiRef.current?.applyLightweight(lightweightMode);
    }, [lightweightMode]);

    // Reload scene when experimentId changes
    useEffect(() => {
      stateRef.current.experimentId = experimentId;
      stateRef.current.params = { ...initialParams };
      stateRef.current.exploded = 0;
      stateRef.current.selectedMeshKey = null;
      engineApiRef.current?.loadScene(experimentId, initialParams);
    }, [experimentId]);

    // Also listen for postMessage commands for WebView bridge compatibility
    useEffect(() => {
      const onMsg = (ev: MessageEvent) => {
        if (ev.data && typeof ev.data === 'object' && typeof ev.data.type === 'string') {
          if (['SET_PARAM', 'SET_PLAYING', 'SET_EXPLODED', 'RESET_CAMERA', 'TOGGLE_ANNOTATIONS'].includes(ev.data.type)) {
            dispatchCommand(ev.data as BridgeCommandToViewer);
          }
        }
      };
      window.addEventListener('message', onMsg);
      return () => window.removeEventListener('message', onMsg);
    }, []);

    // Initialize Three.js WebGLRenderer once
    useEffect(() => {
      const mount = mountRef.current;
      if (!mount) return;

      const isSoftwareGl = detectSoftwareWebGL();
      const width = Math.max(240, mount.clientWidth);
      const height = Math.max(200, mount.clientHeight);

      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl && !stateRef.current.lightweightMode,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.setPixelRatio(
        isSoftwareGl || stateRef.current.lightweightMode ? 1 : Math.min(window.devicePixelRatio, 2)
      );
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = !isSoftwareGl && !stateRef.current.lightweightMode;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.appendChild(renderer.domElement);

      const onLost = (e: Event) => {
        e.preventDefault();
        setContextLost(true);
      };
      const onRestored = () => setContextLost(false);
      renderer.domElement.addEventListener('webglcontextlost', onLost);
      renderer.domElement.addEventListener('webglcontextrestored', onRestored);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x06070b);
      scene.fog = new THREE.FogExp2(0x06070b, 0.018);

      // Procedural Studio IBL via RoomEnvironment
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      pmrem.dispose();

      // 3-Point Warm/Cool Studio Rig calibrated for Obsidian Black dark-studio stage
      const hemi = new THREE.HemisphereLight(0xf1f5f9, 0x1e293b, 0.8);
      scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xfffaf0, 1.55);
      keyLight.position.set(4.5, 7.5, 5.0);
      keyLight.castShadow = !isSoftwareGl;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 22;
      keyLight.shadow.camera.left = -5;
      keyLight.shadow.camera.right = 5;
      keyLight.shadow.camera.top = 5;
      keyLight.shadow.camera.bottom = -5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
      rimLight.position.set(-5.0, 4.0, -5.0);
      scene.add(rimLight);

      // Grounded architectural laboratory plinth + radial contact shadow
      const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
      const benchTex = createBenchSurfaceTexture(maxAnisotropy);
      const plinth = new THREE.Mesh(
        new THREE.CylinderGeometry(4.8, 5.1, 0.24, 64),
        new THREE.MeshStandardMaterial({
          map: benchTex,
          roughness: 0.48,
          metalness: 0.28,
        })
      );
      plinth.position.y = -0.12;
      plinth.receiveShadow = true;
      scene.add(plinth);

      const rimRing = new THREE.Mesh(
        new THREE.TorusGeometry(4.82, 0.026, 10, 80),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.35 })
      );
      rimRing.rotation.x = Math.PI / 2;
      rimRing.position.y = 0.0;
      scene.add(rimRing);

      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(7.2, 7.2),
        new THREE.MeshBasicMaterial({
          map: createContactShadowTexture(),
          transparent: true,
          depthWrite: false,
          opacity: 0.65,
        })
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = 0.005;
      scene.add(shadowPlane);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      const applyResponsiveFov = (w: number, h: number) => {
        const aspect = w / Math.max(1, h);
        camera.aspect = aspect;
        if (aspect < 1.05) {
          const baseHalfRad = THREE.MathUtils.degToRad(45 / 2);
          const portraitHalfRad = Math.atan(Math.tan(baseHalfRad) / Math.max(0.46, aspect * 0.94));
          camera.fov = Math.min(76, THREE.MathUtils.radToDeg(portraitHalfRad * 2));
        } else {
          camera.fov = 45;
        }
        camera.updateProjectionMatrix();
      };
      applyResponsiveFov(width, height);
      camera.position.set(0, 2.8, 5.2);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.07;
      controls.enableRotate = interactive;
      controls.enableZoom = interactive;
      controls.enablePan = interactive;
      controls.minDistance = 1.6;
      controls.maxDistance = 15.0;
      controls.maxPolarAngle = Math.PI * 0.485;
      controls.addEventListener('start', () => {
        stateRef.current.camTransitionActive = false;
      });

      // Active Scene Management
      let activeScene: ActiveLabScene | null = null;
      let registeredComponents: RegisteredComponent[] = [];
      const originalEmissives = new Map<THREE.MeshStandardMaterial, number>();

      const applySelectionHighlight = (meshKey: string | null) => {
        registeredComponents.forEach((comp) => {
          const isSel = meshKey !== null && comp.meshKey === meshKey;
          comp.meshes.forEach((m) => {
            const mat = m.material as THREE.MeshStandardMaterial;
            if (mat && 'emissive' in mat && mat.emissive) {
              if (!originalEmissives.has(mat)) {
                originalEmissives.set(mat, mat.emissive.getHex());
              }
              if (isSel) {
                mat.emissive.setHex(0x0284c7);
              } else {
                mat.emissive.setHex(originalEmissives.get(mat) ?? 0x000000);
              }
            }
          });
        });
      };

      const loadScene = (id: string, params: Record<string, number>) => {
        if (activeScene) {
          activeScene.dispose?.();
          scene.remove(activeScene.root);
          originalEmissives.clear();
        }
        registeredComponents = [];

        const registerComponent = (
          object: THREE.Object3D,
          meshKey: string,
          label: string,
          explodeOffset = new THREE.Vector3(),
          labelAnchorLocal?: THREE.Vector3
        ) => {
          const meshes: THREE.Mesh[] = [];
          object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.userData.meshKey = meshKey;
              meshes.push(mesh);
            }
          });
          registeredComponents.push({
            meshKey,
            label,
            object,
            basePosition: object.position.clone(),
            explodeOffset,
            labelAnchorLocal: labelAnchorLocal ?? new THREE.Vector3(0, 0.5, 0),
            meshes,
          });
        };

        activeScene = buildExperimentScene(id, {
          scene,
          isSoftwareGl,
          isLightweight: stateRef.current.lightweightMode,
          maxAnisotropy,
          registerComponent,
        });
        scene.add(activeScene.root);
        activeScene.updateParams(params);

        stateRef.current.camGoalPos.set(...activeScene.defaultCameraPos);
        stateRef.current.camGoalTarget.set(...activeScene.defaultTarget);
        camera.position.copy(stateRef.current.camGoalPos);
        controls.target.copy(stateRef.current.camGoalTarget);
        controls.update();

        if (!isSoftwareGl) {
          renderer.compile(scene, camera);
        }

        const initialReadouts = activeScene.getReadouts(params);
        callbacksRef.current.onReadoutsChange?.(initialReadouts);
      };

      engineApiRef.current = {
        loadScene,
        resetCamera: () => {
          if (!activeScene) return;
          stateRef.current.camGoalPos.set(...activeScene.defaultCameraPos);
          stateRef.current.camGoalTarget.set(...activeScene.defaultTarget);
          stateRef.current.camTransitionActive = true;
        },
        setComponentVisibility: (meshKey, visible) => {
          registeredComponents
            .filter((c) => c.meshKey === meshKey)
            .forEach((c) => {
              c.object.visible = visible;
            });
        },
        applySelectionHighlight,
        applyLightweight: (enabled) => {
          renderer.setPixelRatio(isSoftwareGl || enabled ? 1 : Math.min(window.devicePixelRatio, 2));
          renderer.shadowMap.enabled = !isSoftwareGl && !enabled;
        },
      };

      // Load initial experiment
      loadScene(stateRef.current.experimentId, stateRef.current.params);

      // Raycasting click selection (distinguish drag vs tap)
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let downX = 0;
      let downY = 0;

      const onPointerDown = (e: PointerEvent) => {
        downX = e.clientX;
        downY = e.clientY;
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!interactive) return;
        const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
        if (dist > 6) return;

        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        const targets: THREE.Object3D[] = [];
        registeredComponents.forEach((c) => {
          if (c.object.visible) targets.push(...c.meshes);
        });
        const hits = raycaster.intersectObjects(targets, false);
        const key = hits.length > 0 ? (hits[0].object.userData.meshKey as string) ?? null : null;
        stateRef.current.selectedMeshKey = key;
        applySelectionHighlight(key);
        callbacksRef.current.onSelectComponent?.(key);
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointerup', onPointerUp);

      // ResizeObserver for crisp layout transitions & automatic portrait-phone FOV framing
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.max(200, entry.contentRect.width);
          const h = Math.max(180, entry.contentRect.height);
          applyResponsiveFov(w, h);
          renderer.setSize(w, h);
        }
      });
      resizeObserver.observe(mount);

      // Animation Loop with Software-WebGL afterDraw Pacing
      let frameId = 0;
      let disposed = false;
      const clock = new THREE.Clock();
      let readoutAccum = 0;
      let annAccum = 0;

      function afterDraw(cb: () => void) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync && gl.deleteSync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      }

      const tick = () => {
        if (disposed) return;
        const dt = Math.min(clock.getDelta(), 0.08);
        const elapsed = clock.elapsedTime;
        const s = stateRef.current;

        if (s.camTransitionActive) {
          camera.position.x = THREE.MathUtils.damp(camera.position.x, s.camGoalPos.x, 7, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, s.camGoalPos.y, 7, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, s.camGoalPos.z, 7, dt);
          controls.target.x = THREE.MathUtils.damp(controls.target.x, s.camGoalTarget.x, 7, dt);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, s.camGoalTarget.y, 7, dt);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, s.camGoalTarget.z, 7, dt);
          if (camera.position.distanceTo(s.camGoalPos) < 0.02) {
            s.camTransitionActive = false;
          }
        }
        controls.update();

        // Smoothly damp exploded view offsets
        registeredComponents.forEach((comp) => {
          _targetPos.copy(comp.basePosition).addScaledVector(comp.explodeOffset, s.exploded);
          comp.object.position.x = THREE.MathUtils.damp(comp.object.position.x, _targetPos.x, 8, dt);
          comp.object.position.y = THREE.MathUtils.damp(comp.object.position.y, _targetPos.y, 8, dt);
          comp.object.position.z = THREE.MathUtils.damp(comp.object.position.z, _targetPos.z, 8, dt);
        });

        if (activeScene) {
          activeScene.updateParams(s.params);
          activeScene.update(dt, elapsed, s.params, s.playing);

          readoutAccum += dt;
          if (readoutAccum > 0.22) {
            readoutAccum = 0;
            callbacksRef.current.onReadoutsChange?.(activeScene.getReadouts(s.params));
          }
        }

        renderer.render(scene, camera);

        // Project 2D annotations every ~65ms when enabled
        annAccum += dt;
        if (s.showAnnotations && annAccum > 0.065) {
          annAccum = 0;
          const cw = mount.clientWidth;
          const ch = mount.clientHeight;
          const nextAnns: Annotation2D[] = registeredComponents.map((comp) => {
            if (!comp.object.visible) {
              return { id: comp.meshKey, label: comp.label, x: 0, y: 0, visible: false, selected: false };
            }
            _worldAnchor.copy(comp.labelAnchorLocal);
            comp.object.localToWorld(_worldAnchor);
            _projVec.copy(_worldAnchor).project(camera);
            const inFront = _projVec.z < 1 && _projVec.z > -1;
            const rawX = ((_projVec.x + 1) / 2) * cw;
            const rawY = ((-_projVec.y + 1) / 2) * ch;
            const x = Math.max(46, Math.min(cw - 46, rawX));
            const y = Math.max(32, Math.min(ch - 14, rawY));
            const inside = inFront && rawX > 8 && rawX < cw - 8 && rawY > 12 && rawY < ch - 8;
            return {
              id: comp.meshKey,
              label: comp.label,
              x,
              y,
              visible: inside,
              selected: s.selectedMeshKey === comp.meshKey,
            };
          });
          setAnnotations(nextAnns);
        }

        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
      };

      frameId = requestAnimationFrame(tick);

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        resizeObserver.disconnect();
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('webglcontextlost', onLost);
        renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
        controls.dispose();
        activeScene?.dispose?.();
        envTex.dispose();
        benchTex.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    }, []);

    return (
      <div className={`relative w-full h-full overflow-hidden bg-[#06070B] ${className}`}>
        {/* Dedicated isolated mount for Three.js WebGL canvas */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Semantic 2D Projected Annotations Overlay (zero backdrop-blur over WebGL!) */}
        {showAnnotations && annotations.length > 0 && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {annotations
              .filter((a) => a.visible)
              .map((ann) => (
                <button
                  key={ann.id}
                  type="button"
                  onClick={() => {
                    stateRef.current.selectedMeshKey = ann.id;
                    engineApiRef.current?.applySelectionHighlight(ann.id);
                    onSelectComponent?.(ann.id);
                  }}
                  style={{
                    transform: `translate3d(${ann.x}px, ${ann.y}px, 0) translate(-50%, -100%)`,
                  }}
                  className={`pointer-events-auto absolute top-0 left-0 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border shadow-md ${
                    ann.selected
                      ? 'bg-[#F4F6FA] text-[#06070B] border-[#F4F6FA] font-semibold'
                      : 'bg-[#0E121B]/95 text-[#F4F6FA] border-[#2B3345] hover:border-[#38BDF8]'
                  }`}
                >
                  {ann.label}
                </button>
              ))}
          </div>
        )}

        {contextLost && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#06070B] text-center p-6">
            <p className="font-display text-lg font-semibold text-[#F4F6FA]">3D Viewport Paused</p>
            <p className="text-sm text-[#98A2B3] mt-1">Restoring WebGL graphics context...</p>
          </div>
        )}
      </div>
    );
  }
);

LabViewerCanvas.displayName = 'LabViewerCanvas';
