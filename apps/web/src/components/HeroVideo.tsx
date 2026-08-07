"use client";

import { useEffect, useRef } from "react";

/**
 * Emblema animado de la portada.
 *
 * El vídeo es un ping-pong (el original hacia delante y luego hacia atrás),
 * montado así en el propio archivo: el movimiento es un zoom lento, y al
 * llegar al final y volver sobre sus pasos el empalme cae exactamente sobre
 * el mismo fotograma, así que el bucle no tiene costura. Sin eso se veía un
 * salto brusco al reiniciarse, porque el último fotograma estaba mucho más
 * cerca que el primero.
 *
 * `muted` + `playsInline` no son opcionales: sin `muted` los navegadores
 * bloquean la reproducción automática, y sin `playsInline` iOS abre el vídeo
 * a pantalla completa en cuanto arranca.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  // Quien pide menos animación en el sistema ve el emblema quieto. El vídeo
  // se queda en el primer fotograma, que es justo la imagen del póster.
  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (media.matches) {
        video.pause();
        video.currentTime = 0;
      } else {
        // Puede fallar si el navegador bloquea el autoplay; en ese caso se
        // queda el póster, que es el mismo fotograma. No hay nada que hacer.
        void video.play().catch(() => {});
      }
    };

    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return (
    <video
      ref={ref}
      className="hero-video"
      poster="/emblema-poster.jpg"
      autoPlay
      loop
      muted
      playsInline
      aria-label="Emblema de Agente BOE: figura dorada con lupa y pluma sobre fondo azul marino"
    >
      <source src="/emblema-loop.mp4" type="video/mp4" />
    </video>
  );
}
