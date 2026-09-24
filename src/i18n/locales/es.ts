import type { Messages } from '../types'

const es: Messages = {
  'app.title': 'Grabador de pantalla en línea',
  'app.unsupported':
    'Este navegador no admite la grabación de pantalla. Usa la versión de escritorio más reciente de Chrome, Edge o Firefox.',
  'app.introTitle': 'Acerca de la herramienta',
  'app.introBody':
    'Graba una pestaña del navegador, una ventana concreta o la pantalla completa. Puedes capturar a la vez el audio del sistema y el micrófono, previsualizar el resultado en línea y descargarlo con un clic.',

  'lang.switch': 'Cambiar idioma',

  'audio.system': 'Audio del sistema',
  'audio.microphone': 'Micrófono',

  'recorder.start': 'Iniciar grabación',
  'recorder.stop': 'Detener grabación',
  'recorder.requesting': 'Esperando permiso...',
  'recorder.pause': 'Pausar grabación',
  'recorder.resume': 'Reanudar grabación',
  'recorder.longWarning': 'Te recomendamos detener pronto la grabación para evitar un uso elevado de memoria',

  'preview.reset': 'Grabar de nuevo',
  'preview.downloadWebm': 'Descargar webm',
  'preview.downloadMp4': 'Descargar mp4',
  'preview.loadingConverter': 'Cargando el conversor...',
  'preview.converting': 'Convirtiendo vídeo... {percent}%',

  'guide.title': 'Guía de uso',
  'guide.step1.title': 'Configurar',
  'guide.step1.desc': 'Marca audio del sistema / micrófono y pulsa «Iniciar grabación»',
  'guide.step2.title': 'Compartir',
  'guide.step2.desc': 'Elige la pestaña / ventana / pantalla y pulsa «Compartir»',
  'guide.step3.title': 'Grabar',
  'guide.step3.desc': 'Puedes pausar; pulsa «Detener grabación» o «Dejar de compartir» para terminar',
  'guide.step4.title': 'Descargar',
  'guide.step4.desc': 'Descarga el vídeo en webm o mp4 con un clic',

  'file.prefix': 'grabacion-pantalla',

  'error.unknown': 'Error desconocido',
  'error.displayMedia': 'No se pudo capturar la pantalla: {reason}',
  'error.micDenied':
    'Falló el acceso al micrófono ({reason}). Solo se grabarán la pantalla y el audio del sistema',
  'error.recorderInit': 'No se puede iniciar la grabación: {reason}',
  'error.recording': 'Error de grabación: {reason}',
  'error.emptyRecording': 'La grabación está vacía, vuelve a grabar',
  'error.converterLoad': 'No se pudo cargar el conversor de vídeo: {reason}',
  'error.mp4Convert': 'Falló la conversión a MP4: {reason}',
}

export default es
