
# meli-filer-api

## Cómo Usar

### Desarrollo

1. Crea una copia del archivo `.env.example`:

   ```bash
   cp .env.example .env.dev
   ```

2. Configura las variables de entorno en `.env.dev`:

   ```plaintext
   HTTP_PORT=
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_REGION=
   AWS_ETAG_EXPIRATION=
   S3_BUCKET=
   RECAPTCHA_SECRET_KEY=
   ```

3. Ejecuta el entorno de desarrollo. El proyecto utiliza el paquete `dotenv` para cargar las variables desde el archivo `.env.dev`:

   ```bash
   npm run dev
   ```

### Producción

1. Crea una copia del archivo `.env.example`:

   ```bash
   cp .env.example .env.prod
   ```

   ⚠️ **Nota**: Los valores dentro del archivo `.env.prod` deben ir sin dobles comillas `""`.

   Ejemplo:
   ```plaintext
   S3_BUCKET=bucket-s3
   ```

2. Compila la imagen de Docker:

   ```bash
   npm run build
   ```

3. Ejecuta el contenedor de Docker:

   - Comando por defecto:

     ```bash
     npm run docker
     ```

   - Comando personalizado:

     ```bash
     docker run -d --name meli-filer-api -p [HTTP_PORT]:[HTTP_PORT] --env-file .env.prod iomaar/meli-filer-api
     ```
