// Terra 3D da introdução, em WebGL (three.js). Carregada só quando a introdução toca.
// Texturas da NASA: Blue Marble (dia) e Black Marble 2016 (luzes à noite), mais um recorte de alta
// resolução das luzes em volta de São Paulo para o fim do mergulho. O Sol fica sobre o Oriente Médio, então a
// África aparece de dia e a América do Sul já está à noite quando a câmera chega.
import {
  AdditiveBlending,
  BackSide,
  LinearFilter,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three';

export type Texturas = { dia: string; noite: string; noiteSp: string };

/** Região do recorte de alta resolução (graus): lon -56..-36, lat -32..-14. */
const SP = { lon0: -56, lon1: -36, lat0: -32, lat1: -14 };
const RAD = Math.PI / 180;

function direcao(lat: number, lon: number) {
  const la = lat * RAD;
  const lo = lon * RAD;
  return new Vector3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo));
}

const vertice = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormalVista;
  void main() {
    vPos = position;
    vNormalVista = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Longitude e latitude saem da posição no objeto: lon = 0 em +z, latitude em y.
const fragmento = /* glsl */ `
  uniform sampler2D dia;
  uniform sampler2D noite;
  uniform sampler2D noiteSp;
  uniform vec3 sol;
  uniform vec4 sp;
  uniform float luzes;
  varying vec3 vPos;
  varying vec3 vNormalVista;
  const float PI = 3.14159265;
  void main() {
    vec3 p = normalize(vPos);
    float lon = atan(p.x, p.z);
    float lat = asin(clamp(p.y, -1.0, 1.0));
    vec2 uv = vec2(lon / (2.0 * PI) + 0.5, lat / PI + 0.5);

    vec3 corDia = texture2D(dia, uv).rgb;
    float acesas = texture2D(noite, uv).r;

    // Dentro do recorte de São Paulo, as luzes vêm da versão de alta resolução (borda suave).
    float dlon = degrees(lon);
    float dlat = degrees(lat);
    vec2 local = vec2((dlon - sp.x) / (sp.y - sp.x), (dlat - sp.z) / (sp.w - sp.z));
    if (local.x > 0.0 && local.x < 1.0 && local.y > 0.0 && local.y < 1.0) {
      float borda = smoothstep(0.0, 0.08, min(min(local.x, 1.0 - local.x), min(local.y, 1.0 - local.y)));
      acesas = mix(acesas, texture2D(noiteSp, local).r, borda);
    }

    float ndl = dot(p, sol);
    float dia_ = smoothstep(-0.12, 0.28, ndl);
    vec3 iluminado = corDia * (0.08 + 1.2 * max(ndl, 0.0));
    // Luzes da cidade: tiram o fundo cinza do mapa noturno e ganham a cor âmbar do site.
    float brilho = pow(smoothstep(0.12, 0.85, acesas), 1.4) * luzes;
    // Núcleo das cidades quase branco-quente, bordas âmbar (sem estourar em amarelo).
    vec3 quente = mix(vec3(0.95, 0.55, 0.2), vec3(1.0, 0.86, 0.62), brilho * brilho);
    vec3 cidade = quente * brilho * 1.05 + vec3(0.035, 0.045, 0.08) * (1.0 - brilho);
    vec3 cor = mix(cidade, iluminado, dia_);

    // Borda da atmosfera: azul do lado do dia, âmbar no crepúsculo.
    float fres = pow(1.0 - max(vNormalVista.z, 0.0), 3.0);
    vec3 ar = mix(vec3(0.95, 0.6, 0.25), vec3(0.45, 0.7, 1.0), dia_);
    cor += ar * fres * (0.25 + 0.6 * dia_);
    gl_FragColor = vec4(cor, 1.0);
  }
`;

const halo = /* glsl */ `
  varying vec3 vNormalVista;
  uniform float forca;
  void main() {
    // Faces de trás de uma esfera um pouco maior: a normal vai de -0,45 (rente ao globo) a 0 (borda
    // externa), então o brilho começa forte no contorno da Terra e some sem degrau.
    float i = pow(clamp(-vNormalVista.z / 0.45, 0.0, 1.0), 2.4) * forca;
    gl_FragColor = vec4(vec3(0.95, 0.62, 0.28) * i, i);
  }
`;

export type Terra3D = {
  /** Desenha um quadro: centro da vista (lat, lon), distância da câmera ao centro (raio = 1). */
  quadro: (lat: number, lon: number, distancia: number) => void;
  medir: () => void;
  destruir: () => void;
};

export async function criarTerra(canvas: HTMLCanvasElement, tex: Texturas): Promise<Terra3D> {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);

  const loader = new TextureLoader();
  const carregar = (url: string, cor: boolean) =>
    new Promise<Texture>((ok, falha) =>
      loader.load(
        url,
        (t) => {
          if (cor) t.colorSpace = SRGBColorSpace;
          t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          ok(t);
        },
        undefined,
        falha,
      ),
    );
  const [dia, noite, noiteSp] = await Promise.all([carregar(tex.dia, true), carregar(tex.noite, false), carregar(tex.noiteSp, false)]);
  // A costura em lon ±180° fica no Pacífico, fora do caminho da câmera; sem mipmap lá não há linha.
  noiteSp.minFilter = LinearFilter;
  noiteSp.generateMipmaps = false;

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.01, 100);
  const material = new ShaderMaterial({
    vertexShader: vertice,
    fragmentShader: fragmento,
    uniforms: {
      dia: { value: dia },
      noite: { value: noite },
      noiteSp: { value: noiteSp },
      sol: { value: direcao(-5, 60) },
      sp: { value: [SP.lon0, SP.lon1, SP.lat0, SP.lat1] },
      luzes: { value: 1 },
    },
  });
  const globo = new Mesh(new SphereGeometry(1, 160, 160), material);
  scene.add(globo);
  const brilho = new Mesh(
    new SphereGeometry(1.12, 96, 96),
    new ShaderMaterial({
      vertexShader: vertice,
      fragmentShader: halo,
      uniforms: { forca: { value: 0.55 } },
      side: BackSide,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  scene.add(brilho);

  function medir() {
    const w = innerWidth;
    const h = innerHeight;
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Em tela em pé, abre o campo de visão para a Terra caber na largura.
    camera.fov = w < h ? 35 * Math.min(1.9, h / w) * 0.75 : 35;
    camera.updateProjectionMatrix();
  }
  medir();

  return {
    medir,
    quadro(lat, lon, distancia) {
      // Gira o globo para (lat, lon) ficar de frente para a câmera, que olha do eixo +z.
      globo.rotation.set(lat * RAD, -lon * RAD, 0, 'XYZ');
      brilho.visible = distancia > 1.6;
      camera.position.set(0, 0, distancia);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    },
    destruir() {
      renderer.dispose();
      [dia, noite, noiteSp].forEach((t) => t.dispose());
    },
  };
}
