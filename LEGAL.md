# BOE Inspector — Textos legales (borrador)

> ⚠️ **Borrador redactado por Claude, no por un abogado.** Sirve para arrancar
> con los requisitos ya incorporados al diseño, no como asesoramiento jurídico.
>
> Sustituye todo lo que aparece entre `[CORCHETES]`.

**Contexto:** servicio **gratuito, sin publicidad y sin ánimo de lucro**
(ver [PORTFOLIO.md](PORTFOLIO.md)). Eso elimina las obligaciones más pesadas
—alta fiscal, IVA, condiciones de contratación, derecho de desistimiento— pero
**no** las tres que sí siguen aplicando íntegramente: las condiciones de
reutilización del BOE, el RGPD respecto de tus suscriptores y de los datos
personales que contiene el propio BOE, y la transparencia sobre el uso de IA.

**Índice**

1. [Aviso legal](#1-aviso-legal)
2. [Política de privacidad](#2-política-de-privacidad)
3. [Política de cookies](#3-política-de-cookies)
4. [Procedimiento de supresión y desindexación](#4-procedimiento-de-supresión-y-desindexación)
5. [Textos operativos cortos](#5-textos-operativos-cortos)
6. [Checklist de implementación](#6-checklist-de-implementación)

---

## 1. Aviso legal

### 1.1. Identificación del titular

- **Titular:** [NOMBRE Y APELLIDOS]
- **Correo de contacto:** [contacto@DOMINIO]
- **Sitio web:** [https://DOMINIO]

> **Sobre cuántos datos publicar.** La obligación de identificación completa del
> artículo 10 de la LSSI se dirige a los prestadores que realizan una actividad
> económica. Al tratarse de un servicio gratuito, sin publicidad ni
> patrocinadores, basta con un nombre y un correo de contacto operativo: **no
> hace falta publicar tu domicilio ni tu NIF**.
>
> Esto cambia en cuanto entre cualquier ingreso —publicidad, patrocinio,
> donaciones recurrentes o un plan de pago—: en ese momento hay que volver a la
> identificación completa y añadir las condiciones de contratación.

### 1.2. Objeto del servicio

[NOMBRE DEL SERVICIO] es un servicio informativo **gratuito e independiente**
que publica resúmenes generados mediante inteligencia artificial de las
disposiciones publicadas en el Boletín Oficial del Estado, junto con el enlace
al documento oficial correspondiente.

### 1.3. Independencia respecto del BOE ⚠️

**[NOMBRE DEL SERVICIO] es un servicio privado e independiente. No es un
servicio oficial, no está vinculado a la Agencia Estatal Boletín Oficial del
Estado, y esta no participa, patrocina ni apoya en modo alguno esta actividad.**

El único texto con valor oficial es el publicado en
[boe.es](https://www.boe.es). Ante cualquier discrepancia entre un resumen
publicado aquí y el texto oficial, **prevalece siempre el texto oficial**.

> Esta cláusula no es opcional: es una obligación expresa de las condiciones de
> reutilización del BOE, y aplica igual siendo gratuito. Debe aparecer de forma
> visible, no enterrada en el pie.

### 1.4. Reutilización de la información del BOE

Este servicio reutiliza información del sector público al amparo de la Ley
37/2007, de 16 de noviembre, sobre reutilización de la información del sector
público, y del Real Decreto 1495/2011, que la desarrolla para el ámbito estatal,
conforme a las condiciones generales de reutilización publicadas por el BOE.

En cumplimiento de dichas condiciones:

- **Fuente:** Basado en datos de la Agencia Estatal Boletín Oficial del Estado
  ([www.boe.es](https://www.boe.es)).
- Cada disposición indica su **fecha de publicación y de última actualización**.
- Los resúmenes son **obra derivada** elaborada por [NOMBRE DEL SERVICIO];
  se identifican como tales y **no constituyen el texto oficial**.
- No se altera ni desnaturaliza el sentido de la información original.

### 1.5. Contenido generado por inteligencia artificial

Conforme al artículo 50 del Reglamento (UE) 2024/1689 (Reglamento de
Inteligencia Artificial), se informa de que:

**Los resúmenes publicados en este sitio han sido generados automáticamente
mediante un sistema de inteligencia artificial.** No han sido revisados
individualmente por una persona antes de su publicación. Pueden contener
errores, omisiones o imprecisiones.

### 1.6. Exención de responsabilidad

Los resúmenes tienen **carácter meramente informativo y divulgativo**. En
particular:

- **No constituyen asesoramiento jurídico** de ningún tipo, ni crean relación
  profesional alguna entre el usuario y el titular.
- **No sustituyen a la lectura del texto oficial** ni al asesoramiento de un
  profesional cualificado.
- El titular **no responde de las decisiones adoptadas** por el usuario sobre la
  base de estos resúmenes, ni de los daños derivados de errores, omisiones,
  retrasos o interrupciones del servicio.
- El servicio se presta **de forma gratuita y sin garantía de disponibilidad,
  continuidad ni exhaustividad**, y puede interrumpirse o cesar en cualquier
  momento sin previo aviso.

Nada de lo anterior excluye la responsabilidad del titular por dolo o culpa
grave.

> **Ser gratuito reduce el riesgo, no lo elimina.** No hay contrato ni
> obligación contractual que incumplir, pero la responsabilidad extracontractual
> por daños sigue existiendo. Los avisos del apartado 1.5, el enlace al texto
> oficial en primer lugar y la ausencia de cualquier apariencia de oficialidad
> son la defensa real, no la letra pequeña.

### 1.7. Propiedad intelectual

Conforme al artículo 13 del Texto Refundido de la Ley de Propiedad Intelectual,
las disposiciones legales y sus correspondientes textos oficiales no son objeto
de propiedad intelectual.

Los resúmenes, la selección, la estructura y el diseño del sitio son obra de
[NOMBRE DEL SERVICIO]. [Se publican bajo licencia [LICENCIA] / Se permite su
cita y enlace con indicación de la fuente.]

El código fuente del servicio está disponible en [ENLACE AL REPOSITORIO] bajo
licencia [MIT / AGPL-3.0].

### 1.8. Legislación aplicable

Las presentes condiciones se rigen por la legislación española.

---

## 2. Política de privacidad

### 2.1. Responsable del tratamiento

- **Responsable:** [NOMBRE Y APELLIDOS]
- **Contacto en materia de protección de datos:** [privacidad@DOMINIO]

### 2.2. Qué datos tratamos y con qué finalidad

| Tratamiento | Datos | Finalidad | Base jurídica (art. 6 RGPD) | Conservación |
|---|---|---|---|---|
| **Navegación web** | Dirección IP, datos técnicos del navegador, páginas visitadas | Prestar el servicio y garantizar su seguridad | Interés legítimo (6.1.f) | 12 meses (logs) |
| **Suscripción por email** *(si se implementa)* | Dirección de correo electrónico | Enviar los avisos de nuevas publicaciones | Consentimiento (6.1.a) | Hasta que se dé de baja |
| **Soporte y contacto** | Los que el usuario facilite en su consulta | Atender la consulta | Consentimiento (6.1.a) | 1 año desde la resolución |

**No hay publicidad, ni analítica de terceros, ni elaboración de perfiles, ni
decisiones automatizadas** con efectos jurídicos sobre los usuarios. **No
vendemos ni cedemos datos a terceros.**

> **La forma más limpia de reducir esto a casi nada:** no ofrecer suscripción por
> email y distribuir solo por Telegram, Discord y RSS. En ese caso no tratas
> ningún dato identificativo de los suscriptores —la lista de miembros del canal
> la gestiona la propia plataforma, bajo su política de privacidad, no la tuya— y
> esta política se queda en los logs del servidor. Es la opción recomendada para
> arrancar.

### 2.3. Datos personales contenidos en el BOE

El Boletín Oficial del Estado contiene, en determinadas secciones, datos
personales de terceros (nombramientos, procesos selectivos, sanciones,
notificaciones edictales, procedimientos concursales).

Nuestra política al respecto:

1. **Publicamos únicamente la Sección I (Disposiciones generales)**, que por su
   naturaleza normativa no contiene datos personales identificativos de forma
   sistemática.
2. Cuando una disposición contenga datos personales, **la página se marca como
   no indexable** (`noindex, noarchive`) para evitar su difusión a través de
   motores de búsqueda.
3. **No ofrecemos búsqueda por nombre de persona** ni ninguna funcionalidad que
   permita construir un perfil de un individuo a partir de publicaciones
   oficiales.
4. Cualquier persona puede solicitar la supresión o desindexación de contenidos
   que le afecten conforme al [procedimiento del apartado 4](#4-procedimiento-de-supresión-y-desindexación).

> **Este es el riesgo legal principal del proyecto, y no desaparece por ser
> gratuito.** Ceñirse a la Sección I lo mantiene bajo control; ampliar a
> nombramientos u oposiciones lo multiplica y obligaría a revisar esta política
> a fondo.

### 2.4. Destinatarios y proveedores

| Proveedor | Servicio | Trata datos personales de usuarios |
|---|---|---|
| [PROVEEDOR DE HOSTING] | Alojamiento del servicio | Sí (logs) — encargado del tratamiento |
| [PROVEEDOR DE IA — p. ej. MiniMax] | Generación de los resúmenes | **No** |

> **Sobre el proveedor de IA:** al servicio de inteligencia artificial se le
> envía **exclusivamente el texto público de las disposiciones del BOE**, que ya
> es información pública oficial. **Nunca se le envían datos de los usuarios del
> servicio.** Por eso no actúa como encargado del tratamiento respecto de tus
> suscriptores, y su ubicación —esté o no fuera de la UE— no plantea un problema
> de transferencia internacional de datos personales.
>
> Este diseño es deliberado: es lo que permite usar el proveedor de IA más barato
> disponible sin arrastrar obligaciones de protección de datos.

### 2.5. Derechos de los interesados

Puedes ejercer en cualquier momento tus derechos de **acceso, rectificación,
supresión, limitación, portabilidad y oposición**, así como retirar el
consentimiento prestado (sin que ello afecte a la licitud del tratamiento
previo), escribiendo a **[privacidad@DOMINIO]**.

Si consideras que el tratamiento no se ajusta a la normativa, puedes presentar
una reclamación ante la **Agencia Española de Protección de Datos**
([www.aepd.es](https://www.aepd.es)).

### 2.6. Baja de las comunicaciones

- **Telegram/Discord:** abandonar el canal, o el comando `/baja`.
- **Email** *(si se implementa)*: enlace de baja en el pie de cada mensaje,
  funcional en un solo clic.

---

## 3. Política de cookies

**[NOMBRE DEL SERVICIO] no utiliza cookies de seguimiento, publicitarias ni de
terceros.**

Se emplean únicamente:

| Cookie | Tipo | Finalidad | Duración |
|---|---|---|---|
| `theme` | Preferencia | Recordar el modo claro/oscuro | 1 año |

Las cookies técnicas y de preferencia establecidas por el propio usuario están
exentas del deber de consentimiento previo (art. 22.2 LSSI), por lo que **no se
muestra banner de cookies**.

Las estadísticas de uso, en su caso, se obtienen mediante una herramienta de
analítica sin cookies y sin recogida de datos personales identificables
(por ejemplo, Plausible o Umami autoalojado).

> No incorporar Google Analytics ni fuentes o incrustaciones externas mantiene
> el sitio libre de banner de cookies. Es una decisión técnica con efecto legal
> directo, y merece la pena conservarla.

---

## 4. Procedimiento de supresión y desindexación

Si eres una persona física cuyos datos aparecen en una disposición publicada en
este sitio y consideras que su difusión perjudica tus derechos, puedes
solicitarnos su supresión o desindexación.

**Cómo solicitarlo:** escribe a **[privacidad@DOMINIO]** indicando la URL
concreta y el motivo. No es necesario que aportes documentación identificativa
en la primera comunicación.

**Nuestro compromiso:**

1. Acusamos recibo en **48 horas**.
2. Resolvemos en un plazo **máximo de 30 días** (art. 12 RGPD).
3. Si la solicitud es estimada, la página se elimina o se marca como no
   indexable y **se solicita a los motores de búsqueda su desindexación**.
4. Te informamos por escrito de la decisión y, si es denegatoria, del motivo y
   de tu derecho a reclamar ante la AEPD.

**Importante:** este procedimiento afecta **únicamente a nuestra publicación**.
No podemos modificar ni retirar el contenido del BOE oficial: para ello debes
dirigirte a la Agencia Estatal Boletín Oficial del Estado.

---

## 5. Textos operativos cortos

Textos listos para incrustar en la interfaz y en los mensajes automáticos.

### 5.1. Pie de cada ficha de disposición (web)

```
⚖️ Resumen generado por inteligencia artificial. Puede contener errores.
El único texto con valor oficial es el publicado en el BOE:
→ [Leer el texto oficial completo en boe.es]

Basado en datos de la Agencia Estatal Boletín Oficial del Estado (www.boe.es).
Publicado el {fecha_publicacion} · Resumen actualizado el {fecha_resumen}.
Servicio gratuito e independiente, no vinculado al BOE.
```

### 5.2. Aviso de cabecera del sitio

```
Proyecto independiente y gratuito. Los resúmenes los genera una IA y no
sustituyen al texto oficial del BOE.
```

### 5.3. Pie de los mensajes de Telegram/Discord

Formato largo (mensaje individual):

```
📄 Texto oficial: {url_boe}
📝 Resumen completo: {url_ficha}

ℹ️ Resumen generado por IA · Servicio no oficial · Solo el texto del BOE tiene
validez legal.
```

Formato corto (mensajes agrupados, para no saturar):

```
ℹ️ Resúmenes por IA · No oficial · Válido solo el texto del BOE
```

### 5.4. Descripción del canal (Telegram/Discord)

```
Lo más importante del BOE cada día, resumido por IA y con enlace al texto
oficial. Gratis y sin publicidad.

⚠️ Proyecto privado e independiente. No vinculado a la Agencia Estatal Boletín
Oficial del Estado, que no lo patrocina ni lo respalda. Los resúmenes son
informativos y pueden contener errores: el único texto válido es el publicado
en boe.es.

Aviso legal y privacidad: [https://DOMINIO/legal]
Código fuente: [ENLACE AL REPOSITORIO]
Baja: abandona el canal o usa /baja
```

### 5.5. Bloque `meta` para páginas con datos personales

```html
<meta name="robots" content="noindex, noarchive, nosnippet">
```

---

## 6. Checklist de implementación

### Antes de publicar la primera disposición

- [ ] Páginas `/legal` y `/privacidad` accesibles desde el pie de todas las
      páginas
- [ ] Aviso de "resumen por IA + no oficial" **en cada ficha**, no solo en el pie
      del sitio
- [ ] Enlace al texto oficial **por encima** del resumen, no debajo
- [ ] Cita de la fuente ("Basado en datos de la Agencia Estatal BOE") y fecha de
      última actualización en cada ficha
- [ ] Campo `fecha_actualizacion` en la entidad `BoeEntry` — obligación de las
      condiciones de reutilización, no un extra
- [ ] `noindex` automático en fichas con datos personales detectados
- [ ] Nada del diseño imita la imagen institucional del BOE (escudo, colores,
      tipografía oficial)
- [ ] El nombre y el dominio elegidos no sugieren oficialidad
- [ ] Buzón `privacidad@DOMINIO` operativo y monitorizado
- [ ] Sin Google Analytics, sin fuentes externas, sin incrustaciones de terceros
      (así no hace falta banner de cookies)

### Si se añade suscripción por email

- [ ] Doble opt-in
- [ ] Enlace de baja en **cada** envío, funcional en un clic
- [ ] Registro de actividades de tratamiento (art. 30 RGPD)
- [ ] Contrato de encargo de tratamiento con el proveedor de email
- [ ] Log de consentimientos (fecha, hora, IP, texto aceptado)

### Si algún día entra dinero (publicidad, patrocinio, donaciones, plan de pago)

Nada de lo anterior basta; habría que volver a:

- [ ] Identificación completa del artículo 10 LSSI (nombre, NIF, domicilio)
- [ ] Alta como autónomo antes del primer ingreso
- [ ] Condiciones de contratación revisadas por un profesional
- [ ] Derecho de desistimiento, facturación con IVA, régimen OSS si aplica
- [ ] Identificación clara de todo contenido patrocinado, dejando fuera de toda
      duda que el patrocinio no procede del BOE
