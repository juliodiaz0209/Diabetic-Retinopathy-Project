# Configuración de Supabase para Diabetic Retinopathy Project

## 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Elige una región cercana a tu ubicación
4. Anota tu `Project URL` y `anon public key`

## 2. Configurar Variables de Entorno

En el directorio `frontend`, crea un archivo `.env.local` con:

```env
VITE_SUPABASE_URL=tu_project_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
VITE_API_URL=https://diabetic-retinopathy-project-488176611125.us-central1.run.app
```

## 3. Configurar Base de Datos

1. Ve a tu proyecto de Supabase
2. Ve a **SQL Editor**
3. Copia y pega el contenido del archivo `supabase_schema.sql`
4. Ejecuta el script completo

## 4. Configurar Autenticación

1. Ve a **Authentication** > **Settings**
2. En **Site URL**, agrega tu URL de desarrollo (ej: `http://localhost:5173`)
3. En **Redirect URLs**, agrega:
   - `http://localhost:5173/login`
   - `http://localhost:5173/register`
   - `http://localhost:5173/dashboard`

## 5. Configurar Políticas de Seguridad

El script SQL ya incluye las políticas RLS (Row Level Security) necesarias:

- Usuarios solo pueden ver/editar sus propios datos
- Pacientes solo pueden ser accedidos por su usuario propietario
- Predicciones solo pueden ser accedidas por el usuario del paciente

## 6. Estructura de la Base de Datos

### Tabla `profiles`
- Extensión de `auth.users` de Supabase
- Almacena username, name, email del usuario

### Tabla `patients`
- Información de pacientes vinculada a usuarios
- Campos: name, age, gender, contact_info

### Tabla `predictions`
- Historial de predicciones de retinopatía
- Campos: prediction_class, confidence_score, model_used

## 7. Ventajas de esta Migración

✅ **Base de datos siempre activa** - No más problemas de "sleep" en Cloud Run
✅ **Autenticación robusta** - JWT tokens, refresh automático
✅ **Seguridad avanzada** - RLS, políticas granulares
✅ **Escalabilidad** - PostgreSQL en la nube
✅ **Backup automático** - Supabase maneja backups
✅ **API automática** - REST y GraphQL automáticos
✅ **Dashboard integrado** - Gestión visual de la base de datos

## 8. Funcionalidades Mantenidas

- ✅ Registro y login de usuarios
- ✅ Gestión de perfiles de pacientes
- ✅ Historial de predicciones
- ✅ Autenticación JWT
- ✅ Protección de rutas

## 9. Funcionalidades del Backend ML

El backend de Python sigue siendo necesario para:
- Procesamiento de imágenes con IA
- Modelos de machine learning
- Predicciones de retinopatía

Solo se migra la gestión de usuarios y datos, no la lógica de ML.

## 10. Pruebas

1. Reinicia el servidor de desarrollo
2. Prueba registro de usuario
3. Prueba login
4. Verifica que se creen las tablas en Supabase
5. Prueba crear un paciente
6. Verifica las políticas de seguridad

## 11. Solución de Problemas

### Error: "Invalid JWT"
- Verifica que las variables de entorno estén correctas
- Asegúrate de que el proyecto de Supabase esté activo

### Error: "RLS policy violation"
- Verifica que las políticas RLS estén habilitadas
- Ejecuta nuevamente el script SQL

### Error: "Table doesn't exist"
- Verifica que el script SQL se ejecutó completamente
- Revisa la consola de Supabase para errores

## 12. Próximos Pasos

1. **Migrar datos existentes** (si los hay)
2. **Implementar funcionalidades adicionales**:
   - Notificaciones por email
   - Dashboard de estadísticas
   - Exportación de reportes
3. **Optimizar consultas** con índices adicionales
4. **Implementar cache** para mejor rendimiento 