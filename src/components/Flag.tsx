// Bandeira como imagem (flagcdn) — renderiza igual em qualquer SO/navegador,
// inclusive Inglaterra (gb-eng) e Escócia (gb-sct), que o emoji não cobre.
// `code` é o código flagcdn (ISO alpha-2 ou subdivisão), guardado em Team.flag.
export default function Flag({ code, alt = "" }: { code: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/h40/${code}.png`}
      srcSet={`https://flagcdn.com/h80/${code}.png 2x`}
      width={28}
      height={20}
      alt={alt}
      loading="lazy"
      className="h-5 w-7 shrink-0 rounded-[2px] object-cover ring-1 ring-black/30"
    />
  );
}
