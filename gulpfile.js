const readlineSync = require('readline-sync');
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const sass = require('gulp-sass')(require('sass'));
const browserSync = require('browser-sync').create();
var gulp = require('gulp');
const chokidar = require('chokidar');
const sourcemaps = require('gulp-sourcemaps');
const cleanCSS = require('clean-css');
const shell = require('shelljs');

let proyectoData = cargarDatos();

// Manejar la señal SIGINT para volver al menú principal
process.on('SIGINT', () => {
  console.log('\nDeteniendo el servidor y regresando al menú principal...');
  // Detener el servidor de BrowserSync
  browserSync.exit();
  // Volver al menú principal
  main();
});

function cargarDatos() {
  try {
    const data = fs.readFileSync('proyecto_data.json', 'utf-8');
    let proyectoData = JSON.parse(data);

    // Verificar que las variables necesarias estén definidas y contengan valores válidos
    if (!proyectoData.construccionRaiz || !proyectoData.construccionTrabajo || !proyectoData.tipoProyecto || !proyectoData.nombreProyecto) {
      console.log('Algunas variables necesarias para construir las rutas están vacías.');
      // Manejar esta situación, por ejemplo, estableciendo valores predeterminados o lanzando una excepción
      return null;
    }

    // Construir las rutas de carpetaRaiz y carpetaTrabajo
    proyectoData.carpetaRaiz = path.normalize(path.join(proyectoData.construccionRaiz, proyectoData.tipoProyecto, 'wordpress', proyectoData.nombreProyecto));
    proyectoData.carpetaTrabajo = path.normalize(path.join(proyectoData.construccionTrabajo, 'Source', 'wordpress', proyectoData.tipoProyecto, proyectoData.nombreProyecto));

    return proyectoData;
  } catch (error) {
    console.log('No se pudo cargar el archivo de datos. Se utilizarán valores predeterminados.');
    return {
      nombreProyecto: 'MiProyecto',
      tipoProyecto: 'Prueba',
      wordpressCore: 'W:\\CoreFiles\\wordpress-6.2\\wordpress',
      baseTheme: 'W:\\CoreFiles\\StarterThemes\\ThemeStarter',
      construccionRaiz: 'W:\\Xampp\\htdocs\\',
      construccionTrabajo: 'A:\\Documents\\WebDevelopment',
      carpetaRaiz: 'W:\\Xampp\\htdocs\\Prueba\\wordpress\\MiProyecto',
      carpetaTrabajo: 'A:\\Documents\\WebDevelopment\\Source\\wordpress\\Prueba\\MiProyecto',
      jsFilePath: proyectoData.carpetaRaiz + '/wp-content/themes/' + proyectoData.nombreProyecto + '/assets/code/general/*.js',
    };
  }
}

function guardarDatos() {
  try {
    const data = JSON.stringify(proyectoData, null, 2);
    fs.writeFileSync('proyecto_data.json', data, 'utf-8');
    console.log('Datos guardados correctamente.');
  } catch (error) {
    console.error('Error al guardar los datos:', error.message);
  }
}

function mostrarDatos() {
  console.log('=== Datos Actuales ===');
  console.log('1. Nombre del Proyecto:', proyectoData.nombreProyecto);
  console.log('2. Tipo de Proyecto:', proyectoData.tipoProyecto);
  console.log('3. Versión de WordPress Core:', proyectoData.wordpressCore);
  console.log('4. Tema base:', proyectoData.baseTheme);
  console.log('5. Carpeta Raíz:', proyectoData.carpetaRaiz);
  console.log('6. Carpeta de Trabajo:', proyectoData.carpetaTrabajo);
}

function editarVariable(variable, nuevoValor) {
  switch (variable) {
    case '1':
      proyectoData.nombreProyecto = nuevoValor;
      break;
    case '2':
      proyectoData.tipoProyecto = nuevoValor;
      break;
    case '3':
      proyectoData.wordpressCore = nuevoValor;
      break;
    case '4':
      proyectoData.baseTheme = nuevoValor;
      break;
    case '5':
      proyectoData.construccionRaiz = nuevoValor;
      proyectoData.carpetaRaiz = path.normalize(path.join(nuevoValor, proyectoData.tipoProyecto, 'wordpress', proyectoData.nombreProyecto));
      break;
    case '6':
      proyectoData.construccionTrabajo = nuevoValor;
      proyectoData.carpetaTrabajo = path.normalize(path.join(nuevoValor, 'Source', 'wordpress', proyectoData.tipoProyecto, proyectoData.nombreProyecto));
      break;
    case '7':
      proyectoData.puerto = nuevoValor;
      proyectoData.url = `http://localhost:${nuevoValor}/${proyectoData.tipoProyecto}/wordpress/${proyectoData.nombreProyecto}`; 
      break;
    default:
      console.log('Variable no válida. Inténtalo de nuevo.');
  }
}

function actualizarDatos() {
  mostrarDatos();
  const opcion = readlineSync.question('Ingresa el número de la variable que deseas editar (0 para salir): ');

  if (opcion === '0') {
    return;
  }

  if (opcion >= '1' && opcion <= '6') {
    const nuevoValor = readlineSync.question(`Ingresa el nuevo valor para la Variable ${opcion}: `);
    editarVariable(opcion, nuevoValor);

    // Si la variable editada es tipoProyecto o nombreProyecto, recalcula el valor de carpetaRaiz y carpetaTrabajo
    if (opcion === '1' || opcion === '2') {
      proyectoData.carpetaRaiz = path.normalize(path.join(proyectoData.construccionRaiz, proyectoData.tipoProyecto, 'wordpress', proyectoData.nombreProyecto));
      proyectoData.carpetaTrabajo = path.normalize(path.join(proyectoData.construccionTrabajo, 'Source', 'wordpress', proyectoData.tipoProyecto, proyectoData.nombreProyecto));
    }

    // Si la variable editada es construccionRaiz o construccionTrabajo, recalcula las rutas de carpetaRaiz y carpetaTrabajo
    if (opcion === '5' || opcion === '6') {
      proyectoData.carpetaRaiz = path.normalize(path.join(proyectoData.construccionRaiz, proyectoData.tipoProyecto, 'wordpress', proyectoData.nombreProyecto));
      proyectoData.carpetaTrabajo = path.normalize(path.join(proyectoData.construccionTrabajo, 'Source', 'wordpress', proyectoData.tipoProyecto, proyectoData.nombreProyecto));
    }

    // Si la variable editada es wordpressCore, actualiza su valor
    if (opcion === '3') {
      proyectoData.wordpressCore = nuevoValor;
    }

    // Si la variable editada es puerto, actualiza la URL
    if (opcion === '7') {
      proyectoData.url = `http://localhost:${nuevoValor}/${proyectoData.tipoProyecto}/wordpress/${proyectoData.nombreProyecto}`;
    }

    console.log('Datos actualizados correctamente.');
  } else {
    console.log('Opción no válida. Inténtalo de nuevo.');
  }
}

function crearProyecto() {
  console.log('\n=== Crear un Nuevo Proyecto ===');
  
  // Confirmación del usuario para utilizar los datos proporcionados anteriormente
  const confirmacion = readlineSync.keyInYNStrict('Se utilizarán los datos proporcionados anteriormente. ¿Desea continuar?');
  
  if (!confirmacion) {
    console.log('Operación cancelada. Volviendo al menú principal.');
    return;
  }
  
  // Verifica si la carpeta del tipo de proyecto existe
  if (!fs.existsSync(proyectoData.carpetaRaiz)) {
    // Crea la carpeta del tipo de proyecto si no existe
    fs.mkdirSync(proyectoData.carpetaRaiz, { recursive: true });
    console.log(`Carpeta del tipo de proyecto '${proyectoData.tipoProyecto}' creada.`);
  } else {
    console.log(`La carpeta del tipo de proyecto '${proyectoData.tipoProyecto}' ya existe.`);
  }
  
  // Verifica si la carpeta del nombre de proyecto existe
  if (fs.existsSync(proyectoData.carpetaTrabajo)) {
    // Advertencia de que la carpeta ya existe y confirmación del usuario para continuar
    const continuar = readlineSync.keyInYNStrict(`La carpeta del nombre de proyecto '${proyectoData.nombreProyecto}' ya existe. ¿Desea continuar y crearla de todas formas?`);
    
    if (!continuar) {
      console.log('Operación cancelada. Volviendo al menú principal.');
      return;
    }
  }
  
  // Crea la carpeta del nombre de proyecto
  fs.mkdirSync(proyectoData.carpetaTrabajo, { recursive: true });
  console.log(`Carpeta del nombre de proyecto '${proyectoData.nombreProyecto}' creada.`);
  
  // Copia los contenidos de wordpressCore a la carpeta del nombre de proyecto
  try {
    fse.copySync(proyectoData.wordpressCore, proyectoData.carpetaRaiz);
    //console.log('Contenidos copiados exitosamente.');
    console.log('Paso 1/3 completado');
  } catch (error) {
    //console.error('Error al copiar los contenidos:', error);
    console.log('Paso 1/3 imcompleto: ', error);
  }

  // Copia el contenido del baseTheme a la carpeta de trabajo
  try {
    fse.copySync(proyectoData.baseTheme, proyectoData.carpetaTrabajo);
    //console.log(`Contenido de baseTheme copiado a la carpeta de trabajo para el proyecto '${proyectoData.nombreProyecto}'.`);
    console.log('Paso 2/3 completado');
  } catch (error) {
    //console.error('Error al copiar el contenido de baseTheme a la carpeta de trabajo:', error);
    console.log('Paso 2/3 incompleto: ', error);
  }

  // Copia la carpeta de trabajo en la carpeta raíz en el directorio wp-content/themes/
  const temaDirRaiz = path.join(proyectoData.carpetaRaiz, 'wp-content', 'themes', proyectoData.nombreProyecto);
  try {
    fse.copySync(proyectoData.carpetaTrabajo, temaDirRaiz);
    //console.log(`Carpeta de trabajo copiada a la carpeta raíz en el directorio wp-content/themes/ para el proyecto '${proyectoData.nombreProyecto}'.`);
    console.log('Paso 3/3 completado');
  } catch (error) {
    //console.error('Error al copiar la carpeta de trabajo a la carpeta raíz:', error);
    console.log('Paso 3/3 incompleto: ', error);
  }

  // Eliminar la carpeta scss en assets
  const scssFolderPath = path.join(proyectoData.carpetaRaiz, 'wp-content', 'themes', proyectoData.nombreProyecto, 'assets', 'scss');
  try {
    fse.removeSync(scssFolderPath);
    //console.log('Carpeta scss eliminada exitosamente.');
    console.log('Paso 4/4 completado');
  } catch (error) {
    //console.error('Error al eliminar la carpeta scss en assets:', error);
    console.log('Paso 4/4 incompleto: ', error);
  }
  
  console.log('Proyecto creado exitosamente.');
}

function sincronizarArchivosPHP() {
  const watcher = chokidar.watch(`${proyectoData.carpetaTrabajo}/**/*.php`, {
    ignored: /node_modules/,
    persistent: true,
    recursive: true,
  });

  watcher.on('change', (path, stats) => {
    //console.log(`Archivo modificado: ${path}`);
    const relativePath = path.replace(proyectoData.carpetaTrabajo, '');
    const destinationPath = `${proyectoData.carpetaRaiz}/wp-content/themes/${proyectoData.nombreProyecto}/${relativePath}`;
    fs.copyFileSync(path, destinationPath);
    browserSync.reload();
  });

  watcher.on('unlink', (path) => {
    //console.log(`Archivo eliminado: ${path}`);
    const relativePath = path.replace(proyectoData.carpetaTrabajo, '');
    const destinationPath = `${proyectoData.carpetaRaiz}/wp-content/themes/${proyectoData.nombreProyecto}/${relativePath}`;
    fs.unlinkSync(destinationPath);
  });

  watcher.on('add', (path) => {
    //console.log(`Archivo sincronizado: ${path}`);
    const relativePath = path.replace(proyectoData.carpetaTrabajo, '');
    const destinationPath = `${proyectoData.carpetaRaiz}/wp-content/themes/${proyectoData.nombreProyecto}/${relativePath}`;
    fs.copyFileSync(path, destinationPath);
  });
}

function compileCSS() {
  return gulp.src(proyectoData.carpetaTrabajo + '/assets/scss/style.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(proyectoData.carpetaRaiz + '/wp-content/themes/'+ proyectoData.nombreProyecto))
}

function sincronizarArchivosJS() {
  const watcher = chokidar.watch(`${proyectoData.carpetaTrabajo}/**/*.js`, {
    ignored: /node_modules/,
    persistent: true,
    recursive: true,
  });

  watcher.on('change', (path, stats) => {
    //console.log(`Archivo JS modificado: ${path}`);
    const relativePath = path.replace(proyectoData.carpetaTrabajo, '');
    const destinationPath = `${proyectoData.carpetaRaiz}/wp-content/themes/${proyectoData.nombreProyecto}/${relativePath}`;
    fs.copyFileSync(path, destinationPath);
    browserSync.reload();
  });

  watcher.on('unlink', (path) => {
    //console.log(`Archivo eliminado: ${path}`);
    const relativePath = path.replace(proyectoData.carpetaTrabajo, '');
    const destinationPath = `${proyectoData.carpetaRaiz}/wp-content/themes/${proyectoData.nombreProyecto}/${relativePath}`;
    fs.unlinkSync(destinationPath);
  });

  watcher.on('add', (path) => {
    //console.log(`Archivo sincronizado: ${path}`);
    const relativePath = path.replace(proyectoData.carpetaTrabajo, '');
    const destinationPath = `${proyectoData.carpetaRaiz}/wp-content/themes/${proyectoData.nombreProyecto}/${relativePath}`;
    fs.copyFileSync(path, destinationPath);
  });
}

function minificarCSS() {
  return gulp.src(proyectoData.carpetaRaiz + '/wp-content/themes/' + proyectoData.nombreProyecto + '/style.css')
      .pipe(cleanCSS())
      .pipe(gulp.dest(proyectoData.carpetaRaiz + '/wp-content/themes/' + proyectoData.nombreProyecto));
}

function sincronizarArchivosSCSS() {
  const watcher = chokidar.watch(`${proyectoData.carpetaTrabajo}/assets/scss/**/*.scss`, {
    ignored: /node_modules/,
    persistent: true,
    recursive: true,
  });

  watcher.on('change', (path, stats) => {
    return gulp.src(proyectoData.carpetaTrabajo + '/assets/scss/style.scss')
      .pipe(sourcemaps.init())
      .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(proyectoData.carpetaRaiz + '/wp-content/themes/'+ proyectoData.nombreProyecto))
      .pipe(browserSync.stream());
  });
}

//function sincronizarCarpetas() {
//  const watcher = chokidar.watch(proyectoData.carpetaTrabajo, {
//      ignored: /node_modules/,
//      persistent: true,
//      ignoreInitial: true,
//      depth: 0 // Solo observa los cambios en el directorio directo, no subdirectorios
//  });
//
//  // Cuando se crea una carpeta en la carpeta de trabajo, copiarla a la carpeta raíz
//  watcher.on('addDir', (ruta) => {
//      const carpetaRelativa = path.relative(proyectoData.carpetaTrabajo, ruta);
//      const carpetaRaiz = path.join(`${proyectoData.carpetaRaiz}/wp-content/themes/${proyectoData.nombreProyecto}`, carpetaRelativa);
//      fse.ensureDir(carpetaRaiz)
//          .then(() => console.log(`Carpeta creada en la carpeta raíz: ${carpetaRaiz}`))
//          .catch(error => console.error('Error al crear carpeta en la carpeta raíz:', error));
//  });
//
//  // Cuando se elimina una carpeta en la carpeta de trabajo, eliminarla de la carpeta raíz
//  //watcher.on('unlinkDir', (ruta) => {
//  //    const carpetaRelativa = path.relative(proyectoData.carpetaTrabajo, ruta);
//  //    const carpetaRaiz = path.join(`${proyectoData.carpetaRaiz}/wp-content/themes/${proyectoData.nombreProyecto}`, carpetaRelativa);
//  //    // Verificar si la carpeta existe en la carpeta raíz
//  //    if (fs.existsSync(CarpetaRaiz)) {
//  //      console.log(`Eliminando carpeta en la carpeta raíz: ${CarpetaRaiz}`);
//  //      fse.removeSync(CarpetaRaiz);
//  //    }
//  //});
//
//  console.log('Observando cambios en la carpeta de trabajo...');
//}

function sincronizarCarpetas() {
  // Configurar el watcher para observar cambios en la carpeta de trabajo
  const watcher = chokidar.watch(proyectoData.carpetaTrabajo, {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true, // Evitar la sincronización inicial para evitar la duplicación de operaciones
    awaitWriteFinish: true // Esperar a que termine la escritura antes de considerar que un archivo se ha añadido
  });

  // Observar cambios en la estructura de directorios
  watcher.on('all', (event, path) => {
    // Obtener la ruta relativa del archivo o directorio modificado
    const relativePath = path.replace(proyectoData.carpetaTrabajo, '');

    // Determinar la acción a realizar según el evento
    switch (event) {
      case 'addDir':
      case 'add':
        // Copiar el archivo o directorio agregado a la carpeta raíz
        fse.copySync(path, `${proyectoData.carpetaRaiz}/wp-content/themes/${proyectoData.nombreProyecto}` + relativePath);
        console.log(`Carpeta/archivo agregado: ${path}`);
        break;
      case 'change':
        // Copiar el archivo modificado a la carpeta raíz
        fse.copySync(path, `${proyectoData.carpetaRaiz}/wp-content/themes/${proyectoData.nombreProyecto}` + relativePath);
        console.log(`Archivo modificado: ${path}`);
        break;
      case 'unlink':
      case 'unlinkDir':
        // Eliminar el archivo o directorio de la carpeta raíz
        fse.removeSync(`${proyectoData.carpetaRaiz}/wp-content/themes/${proyectoData.nombreProyecto}` + relativePath);
        console.log(`Carpeta/archivo eliminado: ${path}`);
        break;
      case 'move':
        // Obtener la ruta de destino del archivo o directorio movido
        const destination = arguments[2];

        // Copiar el archivo o directorio movido a la carpeta raíz
        fse.moveSync(path, `${proyectoData.carpetaRaiz}/wp-content/themes/${proyectoData.nombreProyecto}` + relativePath);
        console.log(`Carpeta/archivo movido de ${path} a ${destination}`);
        break;
      default:
        console.log(`Evento no reconocido: ${event}`);
    }
  });

  console.log('Sincronización de carpetas iniciada.');
}


exports.sincronizarArchivosPHP = sincronizarArchivosPHP;
exports.sincronizarArchivosJS = sincronizarArchivosJS;
exports.sincronizarArchivosJS = sincronizarArchivosSCSS;
exports.sincronizarCarpetas = sincronizarCarpetas;
exports.minificarCSS = minificarCSS;
exports.compileCSS = compileCSS;
exports.default = main;
exports.iniciarProyecto = iniciarProyecto;

var now = gulp.series(compileCSS, (gulp.parallel(sincronizarArchivosPHP, sincronizarArchivosJS, sincronizarArchivosSCSS, sincronizarCarpetas, iniciarProyecto)));
gulp.task('now', now)

function iniciarProyecto() {
  browserSync.init({
    proxy: 'http://localhost/'+ proyectoData.tipoProyecto + '/wordpress/' + proyectoData.nombreProyecto,
    files: proyectoData.carpetaTrabajo + '/**/*',
    ghostMode: false,
    open: true,
    notify: false,
  });

  // Imprimir mensaje fijo en la consola
  process.stdout.write('\x1b[33m'); // Establece el color del texto a amarillo
  console.log('\nPresiona Ctrl + C para detener el servidor.\n');
  process.stdout.write('\x1b[0m'); // Restaura el color del texto a su valor predeterminado

  gulp.watch(proyectoData.carpetaTrabajo + '/assets/scss/**/*.scss', gulp.series(sincronizarArchivosSCSS, minificarCSS));
  gulp.watch(proyectoData.carpetaTrabajo + '/**/*', sincronizarArchivosJS);
  gulp.watch(proyectoData.carpetaTrabajo + '/**/*', sincronizarArchivosPHP);
}

function main(done) {
  while (true) {
    console.log('\n=== Menú de Gulp Workflow ===');
    console.log('1. Actualizar / Consultar datos');
    console.log('2. Crear un proyecto');
    console.log('3. Iniciar / Continuar proyecto');
    console.log('0. Salir');

    const opcion = readlineSync.question('Ingresa el número de la opción que deseas: ');

    switch (opcion) {
      case '1':
        actualizarDatos();
        guardarDatos();
        break;
      case '2':
        crearProyecto();
        break;
      case '3':
        shell.exec('gulp now');
        break;
      case '0':
        guardarDatos();
        console.log('Saliendo del programa\n');
        done();
        return;
      default:
        console.log('Opción no válida. Inténtalo de nuevo.');
    }
  }
}

gulp.task('default', function(done) {
  main(done);
});