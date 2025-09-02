import { Component, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { NotificacaoService, MensagemStatus } from './notificacao.service';
import { Subscription, interval } from 'rxjs';

type Item = { id: string; texto: string; status: MensagemStatus };

@Component({
    selector: 'app-notificacao',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './notificacao.component.html',
    styleUrls: ['./notificacao.component.scss']
})
export class NotificacaoComponent implements OnDestroy {
    texto = '';
    itens: Item[] = [];
    private pollSub?: Subscription;

    constructor(
        private svc: NotificacaoService,
        private zone: NgZone,
        private cdr: ChangeDetectorRef
    ) {
        this.pollSub = interval(4000).subscribe(() => {
            this.itens
                .filter(i => i.status === 'AGUARDANDO_PROCESSAMENTO')
                .forEach(i => {
                    this.svc.status(i.id).subscribe(r => {
                        this.zone.run(() => {
                            i.status = r.status;
                            this.cdr.markForCheck();
                        });
                    });
                });
        });
    }

    ngOnDestroy(): void {
        this.pollSub?.unsubscribe();
    }

    enviar() {
        const conteudoMensagem = this.texto.trim();
        if (!conteudoMensagem) return;

        const mensagemId = uuidv4();
        this.svc.criar({ mensagemId, conteudoMensagem }).subscribe({
            next: _ => {
                this.zone.run(() => {
                    this.itens.unshift({ id: mensagemId, texto: conteudoMensagem, status: 'AGUARDANDO_PROCESSAMENTO' });
                    this.cdr.markForCheck();
                    this.texto = '';
                });
            }
        });
    }

    limpar() { this.itens = []; }
}