export const img = (p: string, w = 900) => `https://images.unsplash.com/${p}?auto=format&fit=crop&w=${w}&q=80`
const P = [
  'photo-1727409048076-182d2907a59e', 'photo-1717185891319-6bf096fba62f', 'flagged/photo-1563296412-742dfbae0afe',
  'photo-1605663864774-748f5f858a08', 'photo-1727409051606-16c4ae5d57d4', 'photo-1735720518631-60257e2fde92',
  'photo-1598318706573-b0ea1463fd6b', 'photo-1657161348514-f8a0b5d10812', 'flagged/photo-1569517282304-d1e2baf737e4',
  'photo-1687089140228-81362f9802f0', 'photo-1605496240272-176f7d1d6158', 'photo-1642603437713-29c53824023c',
  'photo-1785123379791-f54790d6fa80', 'photo-1673201229733-69d19c5c4a87', 'photo-1680835099030-9c7532f744f1',
  'photo-1578353022142-09264fd64295', 'photo-1457972657980-4c9fddebec8d', 'photo-1792695415229-10808ac8aef7',
  'photo-1792695418265-f39ed2e252fc', 'photo-1603300382284-72ddf4985216', 'photo-1595848426977-b5df510c4bab',
  'photo-1662826320776-675aa97220e8', 'photo-1536867520774-5b4f2628a69b', 'photo-1783231607599-ed024129285e',
]
export const ph = (i: number, w = 900) => img(P[i], w)

export const brl = (n: number) => 'R$ ' + n.toLocaleString('pt-BR')

export type Artist = { id: string; name: string; handle: string; specialties: string[]; bio: string; city: string; avatar: string; cover: string; rating: number; reviews: number; followers: string; response: string; instagram?: string; experience?: string }
export const ME_ID = 'me'
export const artists: Artist[] = [
  { id: 'me', name: 'Mari Atelier', handle: '@marinas.cos', specialties: ['Costura', 'Bordado', 'Acessórios'], bio: 'Costureira e cosmaker em Campinas. Crio capas, acessórios e peças bordadas inspiradas em fantasia e animes, sempre conversando cada detalhe com quem vai usar.', city: 'Campinas, SP', avatar: ph(6, 400), cover: ph(14, 1600), rating: 4.9, reviews: 38, followers: '1,2 mil', response: '2 h', instagram: '@marinas.cos', experience: '6 anos' },
  { id: 'nina', name: 'Nina Costumes', handle: '@ninacostumes', specialties: ['Costura', 'Modelagem', 'Corsets'], bio: 'Costureira, modelista e cosmaker transformando personagens em peças que contam histórias. Mais de 200 projetos entregues a cosplayers de todo o Brasil.', city: 'São Paulo, SP', avatar: ph(4, 400), cover: ph(13, 1600), rating: 4.9, reviews: 86, followers: '2,4 mil', response: '2 h' },
  { id: 'lumi', name: 'Lumi Wigs', handle: '@lumiwigs', specialties: ['Perucas', 'Styling', 'Lace front'], bio: 'Perucas estilizadas à mão, com recortes, volumes e cores que respeitam o personagem. Atendo desde iniciantes até competidores de concurso.', city: 'Curitiba, PR', avatar: ph(1, 400), cover: ph(15, 1600), rating: 4.8, reviews: 54, followers: '1,9 mil', response: '4 h' },
  { id: 'forge', name: 'Forge & Foam', handle: '@forgeandfoam', specialties: ['Props', 'Armaduras', 'Impressão 3D'], bio: 'Estúdio de props e armaduras em EVA, resina e impressão 3D. Peças leves, resistentes e pensadas para aguentar um dia inteiro de evento.', city: 'Belo Horizonte, MG', avatar: ph(9, 400), cover: ph(21, 1600), rating: 4.7, reviews: 71, followers: '3,1 mil', response: '6 h' },
  { id: 'akemi', name: 'Akemi Studio', handle: '@akemistudio', specialties: ['Maquiagem', 'SFX', 'Body paint'], bio: 'Maquiadora artística especializada em caracterização e efeitos para cosplay, ensaios e concursos.', city: 'Rio de Janeiro, RJ', avatar: ph(18, 400), cover: ph(17, 1600), rating: 5, reviews: 29, followers: '980', response: '3 h' },
  { id: 'aurora', name: 'Ateliê Aurora', handle: '@atelieaurora', specialties: ['Armaduras', 'Modelagem 3D', 'Props'], bio: 'Armaduras e props modelados em 3D e acabados à mão, com pintura metálica e envelhecimento sob medida.', city: 'Porto Alegre, RS', avatar: ph(11, 400), cover: ph(10, 1600), rating: 4.9, reviews: 47, followers: '1,6 mil', response: '5 h' },
  { id: 'lente', name: 'Lente Viva', handle: '@lenteviva', specialties: ['Fotografia', 'Ensaios', 'Cobertura de eventos'], bio: 'Fotografia cosplay em estúdio e externa. Ensaios planejados com o seu personagem e entrega com tratamento de cor.', city: 'São Paulo, SP', avatar: ph(12, 400), cover: ph(3, 1600), rating: 4.8, reviews: 33, followers: '2,2 mil', response: '8 h' },
]
export const artistById = (id: string) => artists.find((a) => a.id === id) ?? artists[1]

export type Product = { id: string; name: string; artistId: string; price: number; cat: string; condition: 'Novo' | 'Usado'; avail: 'ready' | 'order'; desc: string; images: string[]; status: 'Ativo' | 'Inativo'; date: string; size?: string }
export const seedProducts: Product[] = [
  { id: 'p1', name: 'Armadura Celestial em EVA — sob medida', artistId: 'forge', price: 1280, cat: 'Armaduras', condition: 'Novo', avail: 'order', desc: 'Armadura completa em EVA de alta densidade com acabamento metálico pintado à mão. Feita sob suas medidas, leve para usar durante todo o evento. Prazo e detalhes alinhados no chat.', images: [ph(9), ph(21), ph(10), ph(11)], status: 'Ativo', date: '2025-05-28' },
  { id: 'p2', name: 'Peruca Moonlight estilizada', artistId: 'lumi', price: 390, cat: 'Perucas', condition: 'Novo', avail: 'ready', desc: 'Peruca longa em fibra resistente ao calor, com repicado artístico e base lace front. Pronta para uso e ajustável.', images: [ph(1), ph(0), ph(5)], status: 'Ativo', date: '2025-06-01' },
  { id: 'p3', name: 'Martelo cenográfico Arcane', artistId: 'forge', price: 620, cat: 'Props', condition: 'Novo', avail: 'order', desc: 'Prop inspirado em jogos de fantasia, em EVA e resina com pintura em camadas. Leve, com estrutura interna reforçada.', images: [ph(10), ph(21), ph(8)], status: 'Ativo', date: '2025-05-20' },
  { id: 'p4', name: 'Conjunto Sakura Matsuri bordado', artistId: 'nina', price: 890, cat: 'Costura', condition: 'Novo', avail: 'order', desc: 'Kimono cerimonial reinterpretado, com bordados florais aplicados à mão e obi estruturado. Aceito ajustes de cor e medida.', images: [ph(6), ph(13), ph(16)], status: 'Ativo', date: '2025-05-12' },
  { id: 'p5', name: 'Capa de veludo Feiticeira Escarlate', artistId: 'me', price: 540, cat: 'Costura', condition: 'Novo', avail: 'order', desc: 'Capa longa em veludo com forro acetinado e capuz estruturado. Fecho em corrente dourada. Produzida após alinhamento de medidas.', images: [ph(4), ph(16), ph(15)], status: 'Ativo', date: '2025-06-03' },
  { id: 'p6', name: 'Tiara de cristais Lua Crescente', artistId: 'me', price: 180, cat: 'Acessórios', condition: 'Novo', avail: 'ready', desc: 'Tiara artesanal com cristais facetados e base em arame revestido. Peça única, pronta para envio combinado.', images: [ph(5), ph(0)], status: 'Ativo', date: '2025-06-05' },
  { id: 'p7', name: 'Kit de maquiagem artística Neon', artistId: 'akemi', price: 260, cat: 'Maquiagem', condition: 'Novo', avail: 'ready', desc: 'Kit curado de tintas à base d\u2019água e glitters cosméticos para caracterização, testado em peles sensíveis.', images: [ph(17), ph(18), ph(20), ph(19)], status: 'Ativo', date: '2025-06-02' },
  { id: 'p8', name: 'Orelhas e cauda articuladas Kitsune', artistId: 'me', price: 320, cat: 'Acessórios', condition: 'Novo', avail: 'order', desc: 'Conjunto articulado com mecanismo simples e acabamento em pelúcia premium. Cores personalizáveis.', images: [ph(7), ph(2)], status: 'Ativo', date: '2025-05-30' },
  { id: 'p9', name: 'Espada de luz — prop leve', artistId: 'aurora', price: 450, cat: 'Props', condition: 'Novo', avail: 'ready', desc: 'Prop com acabamento brilhante e empunhadura confortável. Possibilidade de iluminação LED combinada com o artista.', images: [ph(8), ph(21)], status: 'Ativo', date: '2025-05-18' },
  { id: 'p10', name: 'Corset steampunk de couro vegano', artistId: 'nina', price: 760, cat: 'Costura', condition: 'Novo', avail: 'order', desc: 'Corset estruturado com barbatanas, ilhoses metálicos e detalhes envelhecidos. Feito para suas medidas.', images: [ph(2), ph(14), ph(13)], status: 'Ativo', date: '2025-05-25' },
  { id: 'p11', name: 'Máscara kabuki pintada à mão', artistId: 'me', price: 210, cat: 'Acessórios', condition: 'Usado', avail: 'ready', desc: 'Máscara usada em um único evento, em ótimo estado, com pintura original preservada.', images: [ph(6), ph(7)], status: 'Inativo', date: '2025-04-30' },
  { id: 'p12', name: 'Luvas garras de dragão', artistId: 'aurora', price: 380, cat: 'Props', condition: 'Novo', avail: 'order', desc: 'Luvas articuladas com garras em resina e escamas pintadas à mão. Confortáveis para longos períodos de uso.', images: [ph(5), ph(10)], status: 'Ativo', date: '2025-06-04' },
]

export type Service = { id: string; name: string; artistId: string; base: number; time: string; type: string; cat: string; desc: string; images: string[]; status: 'Ativo' | 'Inativo'; extra?: string }
export const seedServices: Service[] = [
  { id: 's1', name: 'Confecção completa de cosplay', artistId: 'nina', base: 900, time: '30–45 dias', type: 'Sob encomenda', cat: 'Costura', desc: 'Do levantamento de referências à prova final, produzo seu cosplay completo com modelagem própria e acabamento profissional. O valor final depende da complexidade e é combinado no chat.', images: [ph(13), ph(14), ph(4)], status: 'Ativo' },
  { id: 's2', name: 'Styling e lace de perucas', artistId: 'lumi', base: 220, time: '10–15 dias', type: 'Customização', cat: 'Perucas', desc: 'Corte, estilização, cobertura de lace e fixação de volume em perucas novas ou que você já possui.', images: [ph(1), ph(15), ph(0)], status: 'Ativo' },
  { id: 's3', name: 'Props em EVA e impressão 3D', artistId: 'forge', base: 350, time: '20–35 dias', type: 'Sob encomenda', cat: 'Props', desc: 'Criação de props sob medida a partir das suas referências, combinando EVA, resina e impressão 3D.', images: [ph(21), ph(10), ph(9)], status: 'Ativo' },
  { id: 's4', name: 'Maquiagem artística e SFX para eventos', artistId: 'akemi', base: 280, time: '3–5 dias', type: 'Presencial', cat: 'Maquiagem', desc: 'Caracterização completa para eventos, concursos e ensaios, com opção de efeitos especiais e body paint.', images: [ph(17), ph(18), ph(19), ph(20)], status: 'Ativo' },
  { id: 's5', name: 'Ensaio fotográfico cosplay', artistId: 'lente', base: 450, time: '7–10 dias', type: 'Presencial', cat: 'Fotografia', desc: 'Ensaio planejado com o seu personagem, em estúdio ou locação, com tratamento de cor e galeria online.', images: [ph(12), ph(3), ph(8)], status: 'Ativo' },
  { id: 's6', name: 'Ajustes e customização de fantasias', artistId: 'me', base: 120, time: '5–10 dias', type: 'Customização', cat: 'Costura', desc: 'Ajustes de medida, troca de fechos, aplicação de apliques e reparos em fantasias já prontas.', images: [ph(16), ph(15), ph(13)], status: 'Ativo' },
  { id: 's7', name: 'Bordados e aplicações personalizadas', artistId: 'me', base: 200, time: '12–20 dias', type: 'Sob encomenda', cat: 'Bordado', desc: 'Bordados à mão e aplicações em tecido para dar identidade ao seu cosplay: brasões, símbolos e texturas.', images: [ph(6), ph(16)], status: 'Ativo' },
  { id: 's8', name: 'Modelagem 3D de armaduras', artistId: 'aurora', base: 600, time: '20–30 dias', type: 'Digital', cat: 'Modelagem 3D', desc: 'Modelagem digital de armaduras e props com arquivos prontos para impressão 3D, divididos em peças para o seu tamanho.', images: [ph(10), ph(9), ph(21)], status: 'Ativo' },
  { id: 's9', name: 'Consultoria de projeto de cosplay', artistId: 'me', base: 90, time: '2–3 dias', type: 'Online', cat: 'Costura', desc: 'Sessão online para planejar materiais, orçamento e etapas do seu próximo cosplay.', images: [ph(15), ph(22)], status: 'Inativo' },
]

export type Work = { id: string; title: string; artistId: string; cat: string; desc: string; techniques: string[]; materials: string[]; images: string[]; year: string }
export const seedWorks: Work[] = [
  { id: 'w1', title: 'Feiticeira Escarlate', artistId: 'me', cat: 'Costura', desc: 'Capa e corset inspirados na heroína. Projeto de 6 semanas com tingimento manual e aplicações metálicas.', techniques: ['Modelagem plana', 'Tingimento', 'Aplicação metálica'], materials: ['Veludo', 'Cetim', 'Corrente dourada'], images: [ph(4), ph(16), ph(15)], year: '2025' },
  { id: 'w2', title: 'Sakura Matsuri', artistId: 'me', cat: 'Bordado', desc: 'Kimono reinterpretado com bordado floral aplicado à mão.', techniques: ['Bordado à mão', 'Aplicação'], materials: ['Seda sintética', 'Linha de seda'], images: [ph(6), ph(13)], year: '2025' },
  { id: 'w3', title: 'Lua Crescente', artistId: 'me', cat: 'Acessórios', desc: 'Conjunto de tiara e colar com cristais facetados.', techniques: ['Wire wrapping', 'Colagem de cristais'], materials: ['Arame', 'Cristais', 'Resina'], images: [ph(5), ph(0)], year: '2024' },
  { id: 'w4', title: 'Kitsune Noturna', artistId: 'me', cat: 'Acessórios', desc: 'Orelhas e cauda articuladas com acabamento em pelúcia.', techniques: ['Estruturação', 'Costura à mão'], materials: ['Pelúcia', 'Arame', 'Espuma'], images: [ph(7), ph(2)], year: '2024' },
  { id: 'w5', title: 'Guardiã de Cristal', artistId: 'me', cat: 'Costura', desc: 'Vestido de fantasia com saia em camadas e detalhes em renda.', techniques: ['Camadas de tule', 'Renda aplicada'], materials: ['Tule', 'Renda', 'Cetim'], images: [ph(0), ph(3)], year: '2024' },
  { id: 'w6', title: 'Ensaio Moonlight', artistId: 'me', cat: 'Perucas', desc: 'Peruca azul estilizada combinada ao figurino para ensaio fotográfico.', techniques: ['Styling', 'Coloração'], materials: ['Fibra sintética'], images: [ph(0), ph(1)], year: '2023' },
  { id: 'w7', title: 'Corset Steampunk', artistId: 'nina', cat: 'Costura', desc: 'Corset estruturado com detalhes envelhecidos.', techniques: ['Modelagem', 'Envelhecimento'], materials: ['Couro vegano', 'Ilhoses'], images: [ph(2), ph(14)], year: '2025' },
  { id: 'w8', title: 'Armadura Guardião', artistId: 'forge', cat: 'Armaduras', desc: 'Armadura completa em EVA e resina.', techniques: ['Termoformagem', 'Pintura metálica'], materials: ['EVA', 'Resina', 'Tinta acrílica'], images: [ph(9), ph(21), ph(11)], year: '2025' },
  { id: 'w9', title: 'Neon Spirit', artistId: 'akemi', cat: 'Maquiagem', desc: 'Caracterização com tintas fluorescentes.', techniques: ['Face paint', 'Aerógrafo'], materials: ['Tintas à base d\u2019água'], images: [ph(17), ph(18)], year: '2025' },
]

export type Community = { id: string; name: string; cat: string; members: string; desc: string; cover: string; rules: string[]; owner: string }
export const seedCommunities: Community[] = [
  { id: 'c1', name: 'Cosmakers Brasil', cat: 'Costura', members: '12,4 mil', desc: 'Um espaço para trocar técnicas, processos e experiências sobre a arte de fazer cosplay.', cover: ph(14, 1400), rules: ['Respeite todos os membros e suas criações.', 'Críticas devem ser construtivas e solicitadas.', 'Não divulgue trabalhos de terceiros sem crédito.', 'Divulgação comercial apenas na área indicada.'], owner: 'ana' },
  { id: 'c2', name: 'Props & Armaduras', cat: 'Props', members: '8,2 mil', desc: 'Tutoriais, moldes e dúvidas sobre EVA, resina, termoformagem e pintura de armaduras.', cover: ph(21, 1400), rules: ['Cite a fonte de moldes compartilhados.', 'Seja claro sobre materiais e segurança.', 'Sem spam de venda.'], owner: 'leo' },
  { id: 'c3', name: 'Wig Makers BR', cat: 'Perucas', members: '5,8 mil', desc: 'Estilização, lace, cores e manutenção de perucas para cosplay.', cover: ph(15, 1400), rules: ['Mostre o processo, não só o resultado.', 'Respeite os diferentes níveis de experiência.'], owner: 'carol' },
  { id: 'c4', name: 'Fotografia Cosplay', cat: 'Fotografia', members: '4,3 mil', desc: 'Fotógrafos e cosplayers combinando ensaios, poses e cuidados em eventos.', cover: ph(12, 1400), rules: ['Peça autorização antes de fotografar.', 'Credite quem fotografou e quem foi fotografado.'], owner: 'rafa' },
  { id: 'c5', name: 'Maquiagem Artística & SFX', cat: 'Maquiagem', members: '3,1 mil', desc: 'Caracterização, body paint e efeitos especiais acessíveis para o dia a dia cosplay.', cover: ph(17, 1400), rules: ['Indique produtos com segurança para a pele.', 'Respeite alergias e limites de cada pessoa.'], owner: 'bia' },
  { id: 'c6', name: 'Cosplay Iniciantes SP', cat: 'Iniciantes', members: '6,7 mil', desc: 'Para quem está começando no cosplay: dúvidas, orçamentos, eventos e encontros em São Paulo.', cover: ph(3, 1400), rules: ['Nenhuma pergunta é boba.', 'Seja gentil com quem está começando.', 'Evite discussões sobre fidelidade ao personagem.'], owner: 'me' },
]

export type Member = { id: string; name: string; avatar: string; role: 'Responsável' | 'Moderador' | 'Membro'; since: string; online?: boolean }
export const members: Member[] = [
  { id: 'm1', name: 'Ana Souza', avatar: ph(1, 200), role: 'Responsável', since: 'Fundadora', online: true },
  { id: 'm2', name: 'Leo Matsuda', avatar: ph(9, 200), role: 'Moderador', since: 'Desde 2023', online: true },
  { id: 'm3', name: 'Carol Nunes', avatar: ph(2, 200), role: 'Moderador', since: 'Desde 2023' },
  { id: 'm4', name: 'Rafael Lima', avatar: ph(11, 200), role: 'Membro', since: 'Desde 2024', online: true },
  { id: 'm5', name: 'Bianca Alves', avatar: ph(18, 200), role: 'Membro', since: 'Desde 2024' },
  { id: 'm6', name: 'Marina Silva', avatar: ph(6, 200), role: 'Membro', since: 'Desde 2025', online: true },
  { id: 'm7', name: 'Yumi Tanaka', avatar: ph(5, 200), role: 'Membro', since: 'Desde 2025' },
  { id: 'm8', name: 'Pedro Dias', avatar: ph(12, 200), role: 'Membro', since: 'Desde 2025', online: true },
]

export type EventItem = { id: string; name: string; cat: string; date: string; time: string; place: string; desc: string; image: string; organizer: string; link: string; owner: string; interested: number; status?: 'Publicado' | 'Em revisão' }
export const seedEvents: EventItem[] = [
  { id: 'e8', name: 'Noite de Maquiagem SFX', cat: 'Workshop', date: '2025-05-31', time: '19:00', place: 'Studio Akemi — Rio de Janeiro, RJ', desc: 'Demonstração ao vivo de efeitos especiais, cicatrizes e envelhecimento para cosplay.', image: ph(17, 1400), organizer: 'Akemi Studio', link: 'https://exemplo.com/sfx', owner: 'akemi', interested: 84 },
  { id: 'e1', name: 'Cosplay Meet: Fantasia Medieval', cat: 'Encontro', date: '2025-06-07', time: '14:00', place: 'Parque Villa-Lobos — São Paulo, SP', desc: 'Encontro aberto de cosplayers de fantasia medieval, com sessão coletiva de fotos e piquenique.', image: ph(11, 1400), organizer: 'Cosplay Iniciantes SP', link: 'https://exemplo.com/meet', owner: 'ana', interested: 212 },
  { id: 'e2', name: 'Workshop de Props em EVA', cat: 'Workshop', date: '2025-06-14', time: '10:00', place: 'Casa Criativa — Campinas, SP', desc: 'Oficina prática de corte, termoformagem e pintura de props em EVA, com material incluso para uso durante a aula.', image: ph(21, 1400), organizer: 'Mari Atelier', link: 'https://exemplo.com/workshop-eva', owner: 'me', interested: 56 },
  { id: 'e7', name: 'Meetup Fotografia Cosplay', cat: 'Encontro', date: '2025-06-18', time: '19:00', place: 'Espaço Lente Viva — São Paulo, SP', desc: 'Troca de experiências entre fotógrafos e cosplayers, com portfólios abertos e networking.', image: ph(8, 1400), organizer: 'Lente Viva', link: 'https://exemplo.com/meetup', owner: 'lente', interested: 98 },
  { id: 'e3', name: 'Anime Friends 2025', cat: 'Convenção', date: '2025-06-21', time: '10:00', place: 'Distrito Anhembi — São Paulo, SP', desc: 'Três dias de painéis, concursos de cosplay, artist alley e encontros de comunidades. Confira a programação completa no site oficial do evento.', image: ph(12, 1400), organizer: 'Maru Division', link: 'https://exemplo.com/anime-friends', owner: 'maru', interested: 1840 },
  { id: 'e4', name: 'Artist Alley SP', cat: 'Feira', date: '2025-06-28', time: '11:00', place: 'Galpão Criativo — São Paulo, SP', desc: 'Feira de artistas independentes com cosmakers, ilustradores e artesãos.', image: ph(3, 1400), organizer: 'Coletivo Alley', link: 'https://exemplo.com/alley', owner: 'alley', interested: 430 },
  { id: 'e5', name: 'Concurso Cosplay Nacional', cat: 'Concurso', date: '2025-07-05', time: '13:00', place: 'Expo Center Norte — São Paulo, SP', desc: 'Etapa nacional com apresentação individual e em grupo, avaliada por jurados convidados.', image: ph(0, 1400), organizer: 'Liga Cosplay Brasil', link: 'https://exemplo.com/nacional', owner: 'liga', interested: 760 },
  { id: 'e6', name: 'Oficina de Perucas Online', cat: 'Workshop', date: '2025-07-12', time: '15:00', place: 'Online — Ao vivo', desc: 'Aprenda corte, estilização e cuidados com perucas, com sessão de perguntas e respostas.', image: ph(1, 1400), organizer: 'Lumi Wigs', link: 'https://exemplo.com/oficina-perucas', owner: 'lumi', interested: 142 },
]
export const eventCats = ['Convenção', 'Encontro', 'Workshop', 'Feira', 'Concurso']

export type Msg = { id: string; from: 'me' | 'them'; text?: string; image?: string; time: string }
export type Conv = { id: string; withId: string; withName: string; withAvatar: string; role: 'client' | 'artist'; ref: { type: 'product' | 'service'; id: string }; last: string; time: string; unread: number; status: 'Em conversa' | 'Em negociação' | 'Concluída' | 'Cancelada'; start: string; summary: string[]; history: { status: string; date: string; by: string }[]; rated?: boolean; messages: Msg[] }
export const seedConvs: Conv[] = [
  { id: 'cv1', withId: 'nina', withName: 'Nina Costumes', withAvatar: ph(4, 200), role: 'client', ref: { type: 'product', id: 'p4' }, last: 'Vou preparar uma estimativa e te envio ainda hoje.', time: '10:42', unread: 2, status: 'Em negociação', start: '12 de maio de 2025', summary: ['Conjunto Sakura em seda sintética rosa-antigo', 'Medidas enviadas no chat (busto, cintura, altura)', 'Prazo informado pela artista: cerca de 35 dias', 'Prova presencial opcional combinada em São Paulo'], history: [{ status: 'Em conversa', date: '12 mai', by: 'Marina' }, { status: 'Em negociação', date: '14 mai', by: 'Nina Costumes' }], messages: [
    { id: 'a1', from: 'them', text: 'Oi, Marina! Vi suas referências e adorei a ideia. Podemos trabalhar os bordados em fio de seda para um acabamento mais delicado.', time: '10:38' },
    { id: 'a2', from: 'me', text: 'Que ótimo! Eu queria algo leve para usar durante todo o evento. Esse tecido funciona bem?', time: '10:40' },
    { id: 'a3', from: 'them', text: 'Funciona sim! Consigo manter o visual e reduzir bastante o peso. Vou preparar uma estimativa e te envio ainda hoje.', time: '10:42' }] },
  { id: 'cv2', withId: 'lumi', withName: 'Lumi Wigs', withAvatar: ph(1, 200), role: 'client', ref: { type: 'service', id: 's2' }, last: 'Perfeito, posso começar na segunda.', time: 'Ontem', unread: 0, status: 'Em conversa', start: '20 de maio de 2025', summary: ['Peruca azul longa com franja repicada', 'Envio da peça combinado diretamente entre as partes'], history: [{ status: 'Em conversa', date: '20 mai', by: 'Marina' }], messages: [
    { id: 'b1', from: 'me', text: 'Olá! Gostaria de um orçamento para estilizar uma peruca azul.', time: 'Ontem 16:10' },
    { id: 'b2', from: 'them', text: 'Oi! Claro. Me manda uma foto de referência do corte?', time: 'Ontem 16:32' },
    { id: 'b3', from: 'them', text: 'Perfeito, posso começar na segunda.', time: 'Ontem 18:05' }] },
  { id: 'cv3', withId: 'lucas', withName: 'Lucas Prado', withAvatar: ph(12, 200), role: 'artist', ref: { type: 'product', id: 'p5' }, last: 'Consegue fazer em tom vinho mais escuro?', time: '09:15', unread: 1, status: 'Em negociação', start: '2 de junho de 2025', summary: ['Capa de veludo em tom vinho', 'Medidas informadas pelo cliente', 'Prazo combinado: 3 semanas'], history: [{ status: 'Em conversa', date: '2 jun', by: 'Lucas Prado' }, { status: 'Em negociação', date: '4 jun', by: 'Mari Atelier' }], messages: [
    { id: 'c1', from: 'them', text: 'Oi, Mari! Amei a capa Feiticeira Escarlate.', time: '09:02' },
    { id: 'c2', from: 'me', text: 'Obrigada, Lucas! Posso adaptar o comprimento e o capuz para você.', time: '09:10' },
    { id: 'c3', from: 'them', text: 'Consegue fazer em tom vinho mais escuro?', time: '09:15' }] },
  { id: 'cv4', withId: 'clara', withName: 'Clara Sato', withAvatar: ph(2, 200), role: 'artist', ref: { type: 'service', id: 's6' }, last: 'Obrigada! Vou te mandar as fotos do vestido.', time: 'Seg', unread: 0, status: 'Em conversa', start: '9 de junho de 2025', summary: ['Ajuste de barra e cintura em vestido de cosplay'], history: [{ status: 'Em conversa', date: '9 jun', by: 'Clara Sato' }], messages: [
    { id: 'd1', from: 'them', text: 'Oi! Vi seu serviço de ajustes. Posso mandar fotos do vestido?', time: 'Seg 11:20' },
    { id: 'd2', from: 'me', text: 'Claro, Clara! Pode enviar.', time: 'Seg 11:35' },
    { id: 'd3', from: 'them', text: 'Obrigada! Vou te mandar as fotos do vestido.', time: 'Seg 11:36' }] },
  { id: 'cv5', withId: 'forge', withName: 'Forge & Foam', withAvatar: ph(9, 200), role: 'client', ref: { type: 'product', id: 'p3' }, last: 'Foi um prazer trabalhar com você!', time: '28 mai', unread: 0, status: 'Concluída', start: '2 de maio de 2025', summary: ['Martelo cenográfico pintado em tom bronze', 'Combinado e finalizado diretamente com o artista'], history: [{ status: 'Em conversa', date: '2 mai', by: 'Marina' }, { status: 'Em negociação', date: '5 mai', by: 'Forge & Foam' }, { status: 'Concluída', date: '28 mai', by: 'Forge & Foam' }], messages: [
    { id: 'e1', from: 'them', text: 'Tudo certo por aqui, Marina. Acabamento finalizado.', time: '28 mai 14:00' },
    { id: 'e2', from: 'me', text: 'Chegou perfeito, obrigada!', time: '28 mai 16:20' },
    { id: 'e3', from: 'them', text: 'Foi um prazer trabalhar com você!', time: '28 mai 16:40' }] },
  { id: 'cv6', withId: 'akemi', withName: 'Akemi Studio', withAvatar: ph(18, 200), role: 'client', ref: { type: 'service', id: 's4' }, last: 'Sem problemas, fica para a próxima!', time: '15 mai', unread: 0, status: 'Cancelada', start: '10 de maio de 2025', summary: ['Maquiagem para concurso — data não coube na agenda'], history: [{ status: 'Em conversa', date: '10 mai', by: 'Marina' }, { status: 'Cancelada', date: '15 mai', by: 'Marina' }], messages: [
    { id: 'f1', from: 'me', text: 'Infelizmente não vou mais conseguir na data.', time: '15 mai 10:00' },
    { id: 'f2', from: 'them', text: 'Sem problemas, fica para a próxima!', time: '15 mai 10:12' }] },
]

export type Review = { id: string; author: string; avatar: string; role: 'Cliente' | 'Artista'; stars: number; text: string; date: string; ref: string; about: 'artist' | 'client' }
export const seedReviews: Review[] = [
  { id: 'r1', author: 'Lucas Prado', avatar: ph(12, 200), role: 'Cliente', stars: 5, text: 'Comunicação muito clara durante todo o projeto. A capa ficou exatamente como combinamos.', date: '12 jun 2025', ref: 'Capa de veludo Feiticeira Escarlate', about: 'artist' },
  { id: 'r2', author: 'Yumi Tanaka', avatar: ph(5, 200), role: 'Cliente', stars: 5, text: 'Acabamento lindo e experiência ótima. Recomendo alinhar todos os detalhes com antecedência.', date: '28 mai 2025', ref: 'Bordados personalizados', about: 'artist' },
  { id: 'r3', author: 'Carlos Mendes', avatar: ph(11, 200), role: 'Cliente', stars: 4, text: 'Trabalho caprichado. O prazo precisou de um pequeno ajuste, mas foi avisado com transparência.', date: '15 mai 2025', ref: 'Tiara de cristais', about: 'artist' },
  { id: 'r4', author: 'Beatriz Alves', avatar: ph(2, 200), role: 'Cliente', stars: 5, text: 'Explicou muito bem os materiais e manteve uma conversa transparente.', date: '2 mai 2025', ref: 'Ajustes de fantasia', about: 'artist' },
  { id: 'r5', author: 'Pedro Dias', avatar: ph(12, 200), role: 'Cliente', stars: 5, text: 'Super atenciosa e criativa. Já indiquei para amigos da comunidade.', date: '20 abr 2025', ref: 'Orelhas Kitsune', about: 'artist' },
  { id: 'r6', author: 'Fernanda Rocha', avatar: ph(1, 200), role: 'Cliente', stars: 3, text: 'Peça bonita, mas houve atraso na resposta em alguns momentos.', date: '8 abr 2025', ref: 'Capa de veludo', about: 'artist' },
  { id: 'r7', author: 'Nina Costumes', avatar: ph(4, 200), role: 'Artista', stars: 5, text: 'Cliente pontual, enviou todas as medidas e referências com clareza.', date: '30 mai 2025', ref: 'Conjunto Sakura', about: 'client' },
  { id: 'r8', author: 'Forge & Foam', avatar: ph(9, 200), role: 'Artista', stars: 5, text: 'Conversa educada e objetiva. Foi tranquilo combinar os detalhes.', date: '28 mai 2025', ref: 'Martelo cenográfico', about: 'client' },
]

export type Notif = { id: string; type: 'message' | 'review' | 'invite' | 'update'; title: string; text: string; time: string; unread: boolean; go: [number, Record<string, string>?] }
export const seedNotifs: Notif[] = [
  { id: 'n1', type: 'message', title: 'Nina Costumes', text: 'enviou uma nova mensagem sobre o Conjunto Sakura.', time: 'há 4 min', unread: true, go: [32, { convId: 'cv1' }] },
  { id: 'n2', type: 'review', title: 'Nova avaliação', text: 'Lucas Prado avaliou sua experiência com 5 estrelas.', time: 'há 1 h', unread: true, go: [37] },
  { id: 'n3', type: 'invite', title: 'Convite de comunidade', text: 'Você foi convidada para entrar em Wig Makers BR.', time: 'há 3 h', unread: true, go: [39, { communityId: 'c3' }] },
  { id: 'n4', type: 'update', title: 'Evento atualizado', text: 'Workshop de Props em EVA teve o horário confirmado para 10h.', time: 'ontem', unread: false, go: [47, { eventId: 'e2' }] },
  { id: 'n5', type: 'message', title: 'Lumi Wigs', text: 'respondeu sua conversa sobre styling de perucas.', time: 'ontem', unread: false, go: [32, { convId: 'cv2' }] },
  { id: 'n6', type: 'update', title: 'Comunidade', text: 'Cosmakers Brasil publicou novas regras de divulgação.', time: '2 dias', unread: false, go: [39, { communityId: 'c1' }] },
]

export const productCats = ['Armaduras', 'Perucas', 'Props', 'Costura', 'Acessórios', 'Maquiagem']
export const serviceCats = ['Costura', 'Bordado', 'Perucas', 'Props', 'Modelagem 3D', 'Maquiagem', 'Fotografia']
export const workCats = ['Costura', 'Bordado', 'Acessórios', 'Armaduras', 'Perucas', 'Props', 'Maquiagem']
export const communityCats = ['Costura', 'Props', 'Perucas', 'Fotografia', 'Maquiagem', 'Iniciantes']
export const interestsAll = ['Costura', 'Armaduras', 'Perucas', 'Maquiagem', 'Props', 'Fotografia', 'Animes', 'Games', 'Fantasia medieval', 'Steampunk']
