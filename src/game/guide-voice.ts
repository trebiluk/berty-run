import type { GuideTopic } from "./field-guide";
import type { Lang } from "./access";

type Line = { title: string; hook: string; checks: { prompt: string; choices: string[] }[] };

/** Short Spanish for the card a student actually reads. The long essay stays in English behind a button. */
const ES: Record<string, Line> = {
  keys: {
    title: "Tipos de teclas",
    hook: "La letra es pintura. La tecla manda un código.",
    checks: [
      { prompt: "¿Qué hace una tecla como Shift?", choices: ["Cambia otra tecla", "Enfría el procesador", "Guarda archivos", "Sube los hercios"] },
      { prompt: "Escape casi siempre", choices: ["te saca", "borra el disco", "apaga la PC", "acelera la RAM"] },
    ],
  },
  switches: {
    title: "Por qué algunas teclas hacen clic",
    hook: "El sonido sale del switch, no de un altavoz.",
    checks: [
      { prompt: "El clic de un teclado ruidoso sale de", choices: ["una barra dentro del switch", "el altavoz de la PC", "el ventilador", "el monitor"] },
      { prompt: "Un switch lineal se siente", choices: ["suave, sin golpe", "como si tuviera que hacer clic", "caliente", "pegajoso solo con la PC apagada"] },
    ],
  },
  "ram-speed": {
    title: "Velocidad de la RAM",
    hook: "La RAM es el escritorio. Al apagar, se vacía.",
    checks: [
      { prompt: "Al apagar la PC, la RAM", choices: ["olvida", "guarda tus archivos", "se vuelve el SSD", "suena más"] },
      { prompt: "DDR quiere decir", choices: ["dos envíos en cada ciclo", "dos ventiladores", "el doble de pantalla", "un tipo de switch"] },
    ],
  },
  "amd-intel": {
    title: "AMD e Intel",
    hook: "Los dos hacen procesadores. El logo no es la ficha.",
    checks: [
      { prompt: "¿Un CPU de AMD entra en cualquier placa Intel?", choices: ["No. El zócalo es distinto.", "Sí, siempre.", "Solo si los ventiladores coinciden.", "Solo en una laptop."] },
      { prompt: "Más núcleos ayudan cuando", choices: ["hay muchas tareas a la vez", "pulsas una tecla", "el teclado es silencioso", "solo cambias las luces"] },
    ],
  },
  gpu: {
    title: "La GPU",
    hook: "El CPU decide. La GPU dibuja.",
    checks: [
      { prompt: "Una GPU es rápida en", choices: ["la misma cuenta en muchos píxeles", "cambiar el teclado", "guardar archivos sin luz", "hacer clic"] },
      { prompt: "La VRAM es", choices: ["memoria en la tarjeta gráfica", "velocidad del ventilador", "un switch", "los hercios del monitor"] },
    ],
  },
  cooling: {
    title: "Ventiladores y calor",
    hook: "El calor sobra. Si se queda, el chip se frena para no quemarse.",
    checks: [
      { prompt: "La pasta térmica sirve para", choices: ["pasar el calor al disipador", "pegar la GPU para siempre", "guardar archivos", "hacer clic en las teclas"] },
      { prompt: "Los ventiladores de entrada y salida deben", choices: ["mover el aire en un solo sentido", "soplar uno contra el otro", "cambiar la RAM", "sonar como un teclado"] },
    ],
  },
  peripherals: {
    title: "Periféricos",
    hook: "Si lo enchufas, es un periférico.",
    checks: [
      { prompt: "Un periférico es", choices: ["algo que enchufas a la computadora", "un núcleo del CPU", "una velocidad de RAM", "solo el ventilador"] },
      { prompt: "El HDMI sobre todo", choices: ["lleva la imagen", "hace clic", "enfría el CPU", "guarda archivos sin luz"] },
    ],
  },
  monitors: {
    title: "HD, 4K y Hz",
    hook: "Más nítido y más suave son dos números distintos.",
    checks: [
      { prompt: "4K, o UHD, es cerca de", choices: ["3840×2160 píxeles", "4 ventiladores", "4 GB de RAM", "4 sonidos de tecla"] },
      { prompt: "144 Hz quiere decir", choices: ["144 imágenes cada segundo", "144 píxeles de ancho", "144 teclas", "144 vatios"] },
    ],
  },
  network: {
    title: "Redes",
    hook: "No mandan el archivo entero. Mandan paquetes.",
    checks: [
      { prompt: "Un paquete es", choices: ["un sobre pequeño de datos", "una barra de RAM", "un switch", "el ventilador de la GPU"] },
      { prompt: "Ethernet suele ser más estable que el Wi-Fi porque", choices: ["es un cable, no una radio compartida", "tiene más teclas", "es 4K", "cambia el CPU"] },
    ],
  },
  quantum: {
    title: "Computadoras cuánticas",
    hook: "Tu PC usa bits. Una máquina cuántica usa qubits. No es una GPU más rápida.",
    checks: [
      { prompt: "Un qubit es distinto porque", choices: ["puede ser mezcla de 0 y 1 hasta que lo mides", "es RAM más rápida", "silencia el teclado", "es un píxel 4K"] },
      { prompt: "Un chip cuántico en una PC de la escuela", choices: ["no es una pieza normal. Son máquinas especiales.", "es la GPU", "es el ventilador", "hace falta si las teclas hacen clic"] },
    ],
  },
  storage: {
    title: "SSD y discos que giran",
    hook: "El SSD es el archivero. La RAM es el escritorio.",
    checks: [
      { prompt: "Un SSD se siente más rápido porque", choices: ["nada tiene que girar", "es la misma pieza que la RAM", "hace clic", "sube los hercios"] },
      { prompt: "La RAM y el SSD se diferencian porque", choices: ["La RAM olvida al apagar. El SSD guarda los archivos.", "son la misma pieza", "el SSD es un ventilador", "la RAM es el monitor"] },
    ],
  },
  power: {
    title: "Vatios",
    hook: "La fuente es un presupuesto, no un puntaje de velocidad.",
    checks: [
      { prompt: "El trabajo de la fuente es", choices: ["volver la corriente de la pared en corriente estable", "dibujar los cuadros", "guardar fotos", "hacer clic"] },
      { prompt: "¿Por qué dejar vatios de sobra?", choices: ["Las piezas piden más de lo normal un instante", "Para que el teclado suene más", "Para que la RAM sea 4K", "Para apagar los ventiladores"] },
    ],
  },
  bits: {
    title: "Bits y bytes",
    hook: "Un bit es un sí o un no. El tamaño de la caja está en bytes.",
    checks: [
      { prompt: "Ocho bits hacen", choices: ["un byte", "un monitor", "un ventilador", "un núcleo"] },
      { prompt: "100 Mb es menos que 100 MB porque", choices: ["un bit es un octavo de un byte", "son iguales", "Mb quiere decir placa", "MB quiere decir botón del ratón"] },
    ],
  },
  boot: {
    title: "Cómo arranca una PC",
    hook: "El primer programa está en la placa, no en Windows.",
    checks: [
      { prompt: "El firmware UEFI vive", choices: ["en un chip de la placa", "en los switches", "solo en la nube", "dentro del ventilador"] },
      { prompt: "El orden de arranque decide", choices: ["qué disco prueba primero", "qué tan fuerte suenan las teclas", "el color RGB", "los hercios"] },
    ],
  },
  os: {
    title: "El sistema operativo",
    hook: "El sistema es el programa que corre los otros programas.",
    checks: [
      { prompt: "El sistema operativo", choices: ["corre los otros programas y comparte las piezas", "es lo mismo que la GPU", "cambia la pasta térmica", "hace clic"] },
      { prompt: "Suspender no es apagar porque", choices: ["suspender deja la RAM con luz", "suspender borra el SSD", "son iguales", "suspender cambia el zócalo"] },
    ],
  },
  drivers: {
    title: "Controladores",
    hook: "Un controlador es el traductor de una pieza.",
    checks: [
      { prompt: "Un controlador es", choices: ["el programa con el que el sistema habla con una pieza", "el ventilador", "una velocidad de RAM", "la pintura de una tecla"] },
      { prompt: "Los hercios altos pueden no aparecer hasta que", choices: ["está el controlador real de la GPU", "las teclas hacen clic", "hay más luces", "se seca la pasta"] },
    ],
  },
  cables: {
    title: "Cables",
    hook: "Que el enchufe entre no quiere decir que sea rápido.",
    checks: [
      { prompt: "USB-C quiere decir", choices: ["una forma de enchufe, no una sola velocidad", "siempre 4K", "siempre una fuente", "un switch"] },
      { prompt: "Un monitor clavado en 60 Hz puede ser porque", choices: ["el cable o el puerto es viejo", "las teclas son lineales", "la RAM es DDR", "el ventilador mete aire"] },
    ],
  },
  fps: {
    title: "FPS y la pantalla",
    hook: "La GPU hace cuadros. El monitor muestra algunos.",
    checks: [
      { prompt: "200 FPS en un monitor de 60 Hz muestra cerca de", choices: ["60 imágenes por segundo", "200 imágenes por segundo", "4K", "nada"] },
      { prompt: "El tearing es", choices: ["dos cuadros en una sola imagen", "una tecla rota", "el CPU frenando a propósito", "la RAM olvidando"] },
    ],
  },
  panels: {
    title: "IPS, TN y OLED",
    hook: "El panel es la pantalla. El nombre no es la resolución.",
    checks: [
      { prompt: "IPS, TN y OLED son", choices: ["tipos de panel", "zócalos de CPU", "velocidades de RAM", "switches"] },
      { prompt: "El negro del OLED es profundo porque", choices: ["esos píxeles se apagan", "tiene más ventiladores", "siempre es 4K", "cambia el sistema"] },
    ],
  },
  layouts: {
    title: "Formas del teclado",
    hook: "Completo, TKL y una laptop son herramientas distintas.",
    checks: [
      { prompt: "TKL quiere decir", choices: ["sin teclado numérico", "sin letras", "un cooler líquido", "diez núcleos"] },
      { prompt: "Un estabilizador es", choices: ["el alambre que evita que una tecla larga se tuerza", "el controlador de la GPU", "el chip de arranque", "una banda de Wi-Fi"] },
    ],
  },
  mouse: {
    title: "El ratón",
    hook: "Los DPI son una cuenta, no una habilidad.",
    checks: [
      { prompt: "DPI es", choices: ["qué tan fino cuenta el sensor el movimiento", "los píxeles del monitor", "una velocidad de RAM", "cuadros por segundo"] },
      { prompt: "El ratón patina en el vidrio porque", choices: ["el sensor necesita textura", "el vidrio es 4K", "el vidrio es un chip cuántico", "las teclas son silenciosas"] },
    ],
  },
  bottleneck: {
    title: "El cuello de botella",
    hook: "La pieza lenta hace esperar a las rápidas.",
    checks: [
      { prompt: "Un cuello de botella es", choices: ["la pieza que hace esperar a las otras", "un tipo de tecla", "más luces", "otro nombre del 4K"] },
      { prompt: "Una GPU más rápida no ayuda mucho cuando", choices: ["el CPU ya está lleno y la GPU espera", "el panel es IPS", "las teclas hacen clic", "la pasta es nueva"] },
    ],
  },
  wifi: {
    title: "Wi-Fi y el módem",
    hook: "El módem trae internet. El router lo comparte.",
    checks: [
      { prompt: "Un módem", choices: ["trae internet al edificio", "hace clic", "enfría el CPU", "guarda la RAM"] },
      { prompt: "El Wi-Fi de 5 GHz, junto al de 2.4, suele ser", choices: ["más rápido y de menos alcance", "un tipo de RAM", "lo mismo que 4K", "un switch silencioso"] },
    ],
  },
  laptop: {
    title: "Laptop o escritorio",
    hook: "El mismo nombre en la caja no es el mismo chip.",
    checks: [
      { prompt: "Una pieza de laptop suele ser", choices: ["soldada, o una versión más chica", "el chip exacto de escritorio", "solo un teclado", "un CPU cuántico"] },
      { prompt: "Una laptop sobre una cobija se frena porque", choices: ["la entrada de aire queda tapada", "la cobija añade RAM", "la cobija sube los hercios", "las teclas hacen clic"] },
    ],
  },
  "rgb-myth": {
    title: "Las luces no son velocidad",
    hook: "El RGB parece una PC de un stream. No suma cuadros.",
    checks: [
      { prompt: "El RGB cambia", choices: ["cómo se ve la caja", "cuántos cuadros salen", "el zócalo del CPU", "el orden de arranque"] },
      { prompt: "Si la PC va lenta, mira primero", choices: ["la pieza que espera, no las luces", "el color de la tira", "si las teclas son azules", "un ajuste cuántico"] },
    ],
  },
  safe: {
    title: "Cuídate",
    hook: "La RAM gratis de un anuncio no es una pieza.",
    checks: [
      { prompt: "Un anuncio de RAM gratis es", choices: ["no es una pieza real. No lo creas.", "una memoria que puedes poner", "el BIOS", "un ventilador"] },
      { prompt: "Un código que llega a tu teléfono es", choices: ["una llave de la cuenta. No lo reenvíes.", "una banda de Wi-Fi", "un switch", "los hercios"] },
    ],
  },
  malware: {
    title: "Virus y candados",
    hook: "Un virus se copia. Un gusano se mueve. El ransomware cierra el archivo.",
    checks: [
      { prompt: "Un virus", choices: ["se copia en la máquina", "es un ventilador", "es un tipo de RAM", "suma cuadros"] },
      { prompt: "El ransomware", choices: ["cierra tus archivos y pide dinero", "es una GPU más rápida", "es un switch silencioso", "es 4K"] },
    ],
  },
};

const UNITS: Record<string, string> = {
  "Build the PC": "Arma la PC",
  "Use it": "Úsala",
  "How it works": "Cómo funciona",
  "Beyond the case": "Más allá de la caja",
};

export function unitLabel(unit: string, lang: Lang) {
  if (lang !== "es") return unit;
  return UNITS[unit] ?? unit;
}

export function voiceOf(topic: GuideTopic, lang: Lang): GuideTopic {
  if (lang !== "es") return topic;
  const line = ES[topic.id];
  if (!line) return topic;
  return {
    ...topic,
    title: line.title,
    hook: line.hook,
    checks: topic.checks.map((check, i) => ({
      prompt: line.checks[i]?.prompt ?? check.prompt,
      choices: line.checks[i]?.choices ?? check.choices,
      answer: check.answer,
    })),
  };
}
