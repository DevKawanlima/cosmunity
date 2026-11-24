
import { useEffect, useMemo, useState } from 'react'

type Municipio = {
  id: number
  nome: string
}

type Estado = {
  sigla: string
  nome: string
}

type CityPickerProps = {
  value: string
  onChange: (cidade: string) => void
  disabled?: boolean
}

const API_IBGE =
  'https://servicodados.ibge.gov.br/api/v1/localidades'

const ESTADOS: Estado[] = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
]

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function obterUF(cidade: string): string {
  const resultado = cidade.match(/,\s*([A-Za-z]{2})$/)

  const uf = resultado?.[1]?.toUpperCase() || ''

  return ESTADOS.some((estado) => estado.sigla === uf)
    ? uf
    : ''
}

function obterNomeCidade(cidade: string): string {
  return cidade.replace(/,\s*[A-Za-z]{2}$/, '').trim()
}

export default function CityPicker({
  value,
  onChange,
  disabled = false,
}: CityPickerProps) {
  const [uf, setUf] = useState(() => obterUF(value))

  const [municipios, setMunicipios] = useState<Municipio[]>([])

  const [pesquisa, setPesquisa] = useState('')

  const [carregando, setCarregando] = useState(false)

  const [erro, setErro] = useState('')

  // Carregar os municipios ao selecionar um estado.
  useEffect(() => {
    if (!uf) {
      setMunicipios([])
      setCarregando(false)
      setErro('')
      return
    }

    const controller = new AbortController()

    async function carregarMunicipios() {
      setCarregando(true)
      setErro('')
      setMunicipios([])

      try {
        const response = await fetch(
          `${API_IBGE}/estados/${uf}/municipios`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}`)
        }

        const dados = (await response.json()) as Municipio[]

        if (!Array.isArray(dados)) {
          throw new Error('Resposta inválida do IBGE.')
        }

        const cidadesOrdenadas = dados
          .filter(
            (item) =>
              typeof item.nome === 'string' &&
              typeof item.id === 'number'
          )
          .sort((a, b) =>
            a.nome.localeCompare(b.nome, 'pt-BR')
          )

        if (!controller.signal.aborted) {
          setMunicipios(cidadesOrdenadas)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setErro(
            'Não foi possível carregar os municípios. ' +
            'Verifique a internet e tente novamente.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false)
        }
      }
    }

    void carregarMunicipios()

    return () => controller.abort()
  }, [uf])

  // Sincroniza o estado quando o perfil real
  // é carregado depois de abrir a tela.
  useEffect(() => {
    if (value) {
      const ufSalva = obterUF(value)

      if (ufSalva && ufSalva !== uf) {
        setUf(ufSalva)
      }
    }
  }, [value, uf])

  const cidadesFiltradas = useMemo(() => {
    const termo = normalizarTexto(pesquisa)

    if (!termo) return municipios

    return municipios.filter((municipio) =>
      normalizarTexto(municipio.nome).includes(termo)
    )
  }, [municipios, pesquisa])

  const cidadeSelecionada =
    obterUF(value) === uf ? obterNomeCidade(value) : ''

  const selecionarEstado = (novoEstado: string) => {
    setUf(novoEstado)
    setPesquisa('')

    // Limpa a cidade antiga para evitar
    // salvar uma cidade de outro estado.
    onChange('')
  }

  const selecionarMunicipio = (nome: string) => {
    if (!nome || !uf) {
      onChange('')
      return
    }

    const municipioValido = municipios.some(
      (municipio) => municipio.nome === nome
    )

    if (!municipioValido) return

    onChange(`${nome}, ${uf}`)
  }

  return (
    <div
      className="form-stack"
      style={{ display: 'grid', gap: 14 }}
    >
      <div>
        <label
          htmlFor="cosmunity-estado"
          style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Estado
        </label>

        <select
          id="cosmunity-estado"
          value={uf}
          disabled={disabled}
          onChange={(event) =>
            selecionarEstado(event.target.value)
          }
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 10,
            background: 'var(--surface, #1c1c29)',
            color: 'inherit',
            border: '1px solid #55556a',
          }}
        >
          <option value="">Selecione um estado</option>

          {ESTADOS.map((estado) => (
            <option
              key={estado.sigla}
              value={estado.sigla}
            >
              {estado.nome} ({estado.sigla})
            </option>
          ))}
        </select>
      </div>

      {uf && (
        <>
          <div>
            <label
              htmlFor="cosmunity-busca-cidade"
              style={{
                display: 'block',
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Pesquisar município
            </label>

            <input
              id="cosmunity-busca-cidade"
              type="search"
              value={pesquisa}
              disabled={disabled || carregando || !!erro}
              onChange={(event) =>
                setPesquisa(event.target.value)
              }
              placeholder="Digite parte do nome da cidade"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                background: 'var(--surface, #1c1c29)',
                color: 'inherit',
                border: '1px solid #55556a',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="cosmunity-municipio"
              style={{
                display: 'block',
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Município
            </label>

            <select
              id="cosmunity-municipio"
              value={cidadeSelecionada}
              disabled={
                disabled ||
                carregando ||
                !!erro ||
                municipios.length === 0
              }
              onChange={(event) =>
                selecionarMunicipio(event.target.value)
              }
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                background: 'var(--surface, #1c1c29)',
                color: 'inherit',
                border: '1px solid #55556a',
              }}
            >
              <option value="">
                {carregando
                  ? 'Carregando municípios...'
                  : 'Selecione um município'}
              </option>

              {cidadesFiltradas.map((municipio) => (
                <option
                  key={municipio.id}
                  value={municipio.nome}
                >
                  {municipio.nome}
                </option>
              ))}

              {cidadeSelecionada &&
                !cidadesFiltradas.some(
                  (item) => item.nome === cidadeSelecionada
                ) && (
                  <option value={cidadeSelecionada}>
                    {cidadeSelecionada}
                  </option>
                )}
            </select>
          </div>
        </>
      )}

      {erro && (
        <p role="alert" style={{ color: '#ff9999' }}>
          {erro}
        </p>
      )}

      {value && (
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          Localização selecionada: <strong>{value}</strong>
        </p>
      )}

      <small style={{ opacity: 0.7 }}>
        Os municípios são consultados na API de Localidades
        do IBGE. A escolha é feita por uma lista, evitando
        erros de digitação.
      </small>
    </div>
  )
}