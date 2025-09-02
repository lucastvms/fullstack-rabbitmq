import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type MensagemStatus = 'AGUARDANDO_PROCESSAMENTO' | 'PROCESSADO_SUCESSO' | 'FALHA_PROCESSAMENTO';

export interface NotificarRequest {
  mensagemId: string;
  conteudoMensagem: string;
}
export interface NotificarResponse {
  mensagemId: string;
}
export interface StatusResponse {
  mensagemId: string;
  status: MensagemStatus;
}

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  criar(req: NotificarRequest) {
    return this.http.post<NotificarResponse>(`${this.base}/api/notificar`, req);
  }

  status(id: string) {
    return this.http.get<StatusResponse>(`${this.base}/api/notificacao/status/${id}`);
  }
}