# Descripción del sistema

El sistema debe convertir textos en valenciano, castellano e inglés en textos mixtos formados por palabras y pictogramas. Su objetivo es apoyar visualmente la lectura, no sustituir todo el texto. La cantidad y el tipo de pictogramas dependerán del perfil del estudiante y de la configuración elegida por el usuario.

## Pasos del sistema

1. **Introducir el texto**
   El usuario escribe o pega un texto en el sistema.

2. **Detectar o seleccionar el idioma**
   El sistema identifica si el texto está en valenciano, castellano o inglés, o permite que el usuario lo seleccione manualmente.

3. **Analizar las palabras**
   El sistema divide el texto en palabras y detecta su tipo: nombre, verbo, adjetivo, adverbio, determinante, preposición, etc.

4. **Detectar conceptos importantes**
   El sistema identifica palabras o grupos de palabras que pueden tener significado propio, como “niño”, “casa”, “comer”, “tener hambre” o “lavarse las manos”.

5. **Asignar importancia**
   Cada palabra o concepto recibe una puntuación de importancia según su papel en la frase, su dificultad, su utilidad para comprender el texto y el perfil del estudiante.

6. **Aplicar el perfil del estudiante**
   El sistema ajusta automáticamente el nivel de apoyo visual. Por ejemplo, puede mostrar más pictogramas para estudiantes que necesitan más ayuda o menos pictogramas para estudiantes con mayor nivel lector.

7. **Aplicar los sliders de la interfaz**
   El usuario puede modificar en tiempo real qué tipos de palabras se convierten en pictogramas. Por ejemplo:

   * nombres al 100%
   * verbos al 0%
   * adjetivos al 30%

8. **Buscar pictogramas**
   El sistema busca el pictograma más adecuado para cada palabra o concepto seleccionado.

9. **Generar el texto mixto**
   El sistema crea una versión del texto combinando palabras y pictogramas.

   Ejemplo:

   Texto original:
   El niño vive en una casa grande.

   Con nombres al 100% y verbos al 0%:
   El `<picto niño>` vive en una `<picto casa>` grande.

   Con nombres, verbos y adjetivos al 100%:
   El `<picto niño>` `<picto vive>` en una `<picto casa>` `<picto grande>`.

10. **Permitir edición manual**
    El usuario puede seleccionar una palabra o fragmento y convertirlo en pictograma, quitar un pictograma, cambiarlo o buscar otro si el elegido no es correcto.

11. **Actualizar en tiempo real**
    Cuando el usuario mueve sliders, cambia el perfil o edita un pictograma, el texto se actualiza automáticamente.

12. **Exportar o guardar el resultado**
    El usuario puede guardar, imprimir o exportar el texto adaptado para usarlo como material educativo.

## Resultado esperado

El resultado final debe ser un texto editable, accesible y personalizado, que combine palabras y pictogramas según las necesidades del estudiante.

El sistema debe permitir pasar de un apoyo visual alto a uno más reducido, manteniendo siempre la posibilidad de ajuste manual por parte del docente o profesional.

