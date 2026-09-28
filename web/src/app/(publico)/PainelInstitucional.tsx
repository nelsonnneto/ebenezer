import { supabaseUrl } from '@/lib/ambiente';

/** Metade esquerda das telas de acesso: foto ilustrativa + faixa da marca (Figma: Acesso — Web · 1440). */
export function PainelInstitucional() {
  const foto = `${supabaseUrl()}/storage/v1/object/public/midia/05-roda-de-conversa.jpg`;
  return (
    <div className="relative hidden min-h-screen flex-col justify-end bg-skeleton lg:flex">
      <img src={foto} alt="Crianças e educadores sentados em roda, sorrindo. Imagem ilustrativa." className="absolute inset-0 h-full w-full object-cover" />
      <div className="relative bg-fill-4/95 px-16 py-12 text-on-action">
        <p className="font-serif text-[26px] italic leading-9">“Se mudarmos o começo da história, mudamos a história toda.”</p>
        <p className="text-caps mt-4 text-on-action">Instituto Social Ebenézer&nbsp;&nbsp;·&nbsp;&nbsp;Jardim Ângela, São Paulo</p>
      </div>
    </div>
  );
}
