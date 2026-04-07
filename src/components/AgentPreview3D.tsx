import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface AgentPreview3DProps {
  className?: string;
  modelUrl?: string;
  fallbackImgUrl?: string;
  height?: number;
  yOffset?: number;
  showErrorOverlay?: boolean;
}

export default function AgentPreview3D({
  className,
  modelUrl = "/models/agent.glb",
  fallbackImgUrl = "/placeholder.svg",
  height = 520,
  yOffset = 10,
  showErrorOverlay = true,
}: AgentPreview3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadError, setLoadError] = useState<string>("");

  const size = useMemo(() => ({ w: 520, h: height }), [height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size.w, size.h, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, size.w / size.h, 0.1, 2000);
    camera.position.set(0, 70, 220);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(120, 220, 160);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-140, 120, -80);
    scene.add(fill);

    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.rotateSpeed = 0.6;
    controls.minPolarAngle = Math.PI / 2.7;
    controls.maxPolarAngle = Math.PI / 2.0;
    controls.target.set(0, 65 + yOffset, 0);
    controls.update();

    let disposed = false;
    let model: THREE.Object3D | null = null;

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return;
        model = gltf.scene;
        model.position.set(0, yOffset, 0);
        model.rotation.y = Math.PI * 0.15;

        // normalize size
        const box = new THREE.Box3().setFromObject(model);
        const sizeVec = new THREE.Vector3();
        box.getSize(sizeVec);
        const maxAxis = Math.max(sizeVec.x, sizeVec.y, sizeVec.z) || 1;
        const scale = 140 / maxAxis;
        model.scale.setScalar(scale);

        scene.add(model);
      },
      undefined,
      (err) => {
        if (disposed) return;
        setLoadError("3D модель не найдена. Положите файл в public/models/agent.glb");
        // eslint-disable-next-line no-console
        console.warn("AgentPreview3D load error", err);
      }
    );

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      if (model) model.rotation.y += dt * 0.15; // subtle idle spin
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", onResize);
    onResize();

    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      controls.dispose();
      renderer.dispose();
      // best-effort dispose geometries/materials
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose?.();
        const mat = (mesh.material as any) ?? null;
        if (Array.isArray(mat)) mat.forEach((m) => m?.dispose?.());
        else mat?.dispose?.();
      });
    };
  }, [modelUrl, size.w, size.h, yOffset]);

  return (
    <div className={className} style={{ width: "100%", maxWidth: 520 }}>
      <div className="relative">
        <canvas ref={canvasRef} style={{ width: "100%", height }} />
        {loadError && (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <img src={fallbackImgUrl} alt="" className="w-full h-full object-contain opacity-40" />
            </div>
            {showErrorOverlay && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-white text-sm p-6 text-center">
                {loadError}
              </div>
            )}
          </>
        )}
      </div>
      <div className="mt-2 text-xs text-muted-foreground text-center">
        ЛКМ — крутить (поиграться). Колёсико/зум отключены.
      </div>
    </div>
  );
}

