'use client'

import { useState } from 'react'
import { Participante, Evento } from '@/types'
import EventoForm from './evento-form'
import DiaDeEventoForm from './dia-de-evento-form'
import AtivarCodigoForm from './ativar-codigo-form'
import QrCodeDisplay from './qr-code-display'
import { useLogout } from '@/hooks/use-logout'

interface Props {
  participante: Participante
  eventos: (Evento & { dias_de_evento: any[] })[]
}

/**
 * Painel do Organizador.
 * Permite criar Eventos, adicionar DiaDeEvento, ativar CodigoDoDia e visualizar QR codes.
 */
export default function AdminContent({ participante, eventos: eventosIniciais }: Props) {
  const [eventos, setEventos] = useState(eventosIniciais)
  const [diaQrAberto, setDiaQrAberto] = useState<string | null>(null)
  const logout = useLogout()

  function handleEventoCriado(novoEvento: Evento) {
    setEventos(prev => [{ ...novoEvento, dias_de_evento: [] }, ...prev])
  }

  function handleDiaCriado(eventoId: string, novoDia: any) {
    setEventos(prev =>
      prev.map(e =>
        e.id === eventoId
          ? { ...e, dias_de_evento: [...e.dias_de_evento, novoDia] }
          : e
      )
    )
  }

  function handleDiaAtivado(diaAtualizado: any) {
    setEventos(prev =>
      prev.map(e => ({
        ...e,
        dias_de_evento: e.dias_de_evento.map(d =>
          d.id === diaAtualizado.id ? diaAtualizado : d
        ),
      }))
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Painel do Organizador</h1>
            <p className="text-gray-500 text-sm">{participante.email}</p>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
            Sair
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">Criar novo Evento</h2>
          <EventoForm onEventoCriado={handleEventoCriado} />
        </div>

        {eventos.map(evento => (
          <div key={evento.id} className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <h3 className="font-bold text-lg text-blue-900 mb-1">{evento.nome}</h3>
            {evento.descricao && <p className="text-gray-500 text-sm mb-4">{evento.descricao}</p>}

            <div className="space-y-3 mb-4">
              {evento.dias_de_evento.map((dia: any) => (
                <div key={dia.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-700">{dia.data}</p>
                      <p className="text-sm text-gray-500">Abertura: {dia.hora_abertura} - {dia.duracao_minutos} min</p>
                      <p className="text-sm mt-1">
                        {dia.codigo_do_dia
                          ? <span className="text-green-600 font-medium">Ativado</span>
                          : <span className="text-yellow-600">Aguardando ativacao</span>
                        }
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {dia.codigo_do_dia && (
                        <button
                          onClick={() => setDiaQrAberto(diaQrAberto === dia.id ? null : dia.id)}
                          className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-100"
                        >
                          {diaQrAberto === dia.id ? 'Fechar QR' : 'Ver QR'}
                        </button>
                      )}
                    </div>
                  </div>
                  {!dia.codigo_do_dia && (
                    <div className="mt-3 pt-3 border-t">
                      <AtivarCodigoForm diaId={dia.id} onAtivado={handleDiaAtivado} />
                    </div>
                  )}
                  {diaQrAberto === dia.id && (
                    <div className="mt-3 pt-3 border-t">
                      <QrCodeDisplay diaId={dia.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-gray-600 mb-3">Adicionar dia</p>
              <DiaDeEventoForm eventoId={evento.id} onDiaCriado={(dia) => handleDiaCriado(evento.id, dia)} />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
