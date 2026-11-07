import { bootstrapApplication } from '@angular/platform-browser';
import { configuracionAplicacion } from './app/aplicacion.configuracion';
import { Aplicacion } from './app/aplicacion';

bootstrapApplication(Aplicacion, configuracionAplicacion).catch((fallo) => console.error(fallo));
