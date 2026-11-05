export type ScreenMeta = { id: number; title: string; group: string }
const g = (group: string, start: number, titles: string[]): ScreenMeta[] => titles.map((title, i) => ({ id: start + i, title, group }))
export const GROUPS = ['Design System', 'Acesso e Cadastro — 01 a 07', 'Páginas Principais — 08 a 14', 'Artistas e Portfólios — 15 a 20', 'Gerenciamento do Artista — 21 a 30', 'Conversas e Negociações — 31 a 34', 'Avaliações — 35 a 37', 'Comunidades — 38 a 44', 'Calendário — 45 a 49', 'Conta e Configurações — 50 a 55', 'Componentes Adicionais — 56 a 63']
export const SCREENS: ScreenMeta[] = [
  { id: 0, title: 'Biblioteca do Design System', group: GROUPS[0] },
  ...g(GROUPS[1], 1, ['Landing Page', 'Cadastro', 'Confirmação de e-mail', 'Login', 'Recuperação de senha', 'Redefinição de senha', 'Confirmação de celular']),
  ...g(GROUPS[2], 8, ['Página inicial do usuário', 'Marketplace', 'Todos os produtos', 'Todos os serviços', 'Resultados da pesquisa', 'Detalhes do produto', 'Detalhes do serviço']),
  ...g(GROUPS[3], 15, ['Perfil público do artista', 'Portfólio completo', 'Detalhes do trabalho', 'Tornar-se artista', 'Cadastro do perfil artístico', 'Editar perfil artístico']),
  ...g(GROUPS[4], 21, ['Painel do artista', 'Meus produtos', 'Cadastrar produto', 'Editar produto', 'Meus serviços', 'Cadastrar serviço', 'Editar serviço', 'Meu portfólio', 'Adicionar trabalho', 'Editar trabalho']),
  ...g(GROUPS[5], 31, ['Lista de conversas', 'Chat privado', 'Detalhes da negociação', 'Confirmação de conclusão (modal)']),
  ...g(GROUPS[6], 35, ['Avaliar artista (modal)', 'Avaliar cliente (modal)', 'Visualização das avaliações']),
  ...g(GROUPS[7], 38, ['Página de comunidades', 'Detalhes da comunidade', 'Chat da comunidade', 'Criar comunidade', 'Editar comunidade', 'Participantes', 'Sair da comunidade (modal)']),
  ...g(GROUPS[8], 45, ['Calendário', 'Lista de eventos', 'Detalhes do evento', 'Cadastrar evento', 'Editar evento']),
  ...g(GROUPS[9], 50, ['Meu perfil', 'Editar perfil', 'Configurações', 'Alterar senha', 'Confirmação de logout (modal)', 'Desativar conta']),
  ...g(GROUPS[10], 56, ['Menu de notificações', 'Nova mensagem', 'Confirmar exclusão', 'Confirmar desativação', 'Aviso de sucesso', 'Aviso de erro', 'Visualizador de imagens', 'Menu de filtros']),
]
export const screenTitle = (id: number) => SCREENS.find((s) => s.id === id)
export const FLOWS: { key: string; title: string; start: 'visitor' | 'user' | 'artist'; steps: number[] }[] = [
  { key: 'A', title: 'Novo usuário', start: 'visitor', steps: [1, 2, 3, 4, 8] },
  { key: 'B', title: 'Recuperação de acesso', start: 'visitor', steps: [4, 5, 6, 4] },
  { key: 'C', title: 'Exploração de produtos', start: 'visitor', steps: [9, 10, 13, 15, 32] },
  { key: 'D', title: 'Contratação de serviço', start: 'user', steps: [9, 11, 14, 32, 33] },
  { key: 'E', title: 'Ativação de artista', start: 'user', steps: [50, 18, 7, 19, 21] },
  { key: 'F', title: 'Gerenciamento de anúncios', start: 'artist', steps: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30] },
  { key: 'G', title: 'Negociação e avaliações', start: 'artist', steps: [32, 33, 34, 36, 35, 37] },
  { key: 'H', title: 'Comunidades', start: 'user', steps: [38, 39, 43, 40, 41, 42, 44] },
  { key: 'I', title: 'Eventos', start: 'user', steps: [45, 46, 47, 48, 49] },
  { key: 'J', title: 'Conta', start: 'user', steps: [50, 51, 52, 53, 55, 54] },
]
