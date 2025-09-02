import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { NotificacaoComponent } from './notificacao.component';

describe('NotificacaoComponent (zoneless)', () => {
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NotificacaoComponent],
            providers: [
                provideZonelessChangeDetection(),
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });
        http = TestBed.inject(HttpTestingController);
        // mock timers for RxJS interval(4000)
        jasmine.clock().install();
    });

    afterEach(() => {
        http.verify();
        jasmine.clock().uninstall();
    });

    it('creates item with AGUARDANDO_PROCESSAMENTO after POST', (done) => {
        const f = TestBed.createComponent(NotificacaoComponent);
        const c = f.componentInstance;

        c.texto = 'hello';
        c.enviar();

        // Capture the outgoing request
        const req = http.expectOne(`${environment.apiBase}/api/notificar`);
        expect(req.request.method).toBe('POST');

        // The component generated mensagemId (uuid) before calling the API.
        const sentId = (req.request.body as any).mensagemId as string;
        expect(typeof sentId).toBe('string');
        expect(sentId.length).toBeGreaterThan(10); // sanity check

        // Respond success (server echoes/returns an id, but component uses the client UUID)
        req.flush({ mensagemId: sentId });

        // Assert the item was queued locally with the same generated id
        expect(c.itens.length).toBe(1);
        expect(c.itens[0]).toEqual({
            id: sentId,
            texto: 'hello',
            status: 'AGUARDANDO_PROCESSAMENTO'
        });
        done();
    });

    it('polling updates status to PROCESSADO_SUCESSO', (done) => {
        const f = TestBed.createComponent(NotificacaoComponent);
        const c = f.componentInstance;

        // seed a waiting item
        c.itens.unshift({ id: 'id-1', texto: 'x', status: 'AGUARDANDO_PROCESSAMENTO' });

        // trigger first poll
        jasmine.clock().tick(4000);

        const get = http.expectOne(`${environment.apiBase}/api/notificacao/status/id-1`);
        expect(get.request.method).toBe('GET');
        get.flush({ mensagemId: 'id-1', status: 'PROCESSADO_SUCESSO' });

        expect(c.itens[0].status).toBe('PROCESSADO_SUCESSO');
        done();
    });

    it('does not POST when input is empty/whitespace', () => {
        const f = TestBed.createComponent(NotificacaoComponent);
        const c = f.componentInstance;

        c.texto = '   ';
        c.enviar();

        // no HTTP calls should have been made
        const calls = http.match(() => true);
        expect(calls.length).toBe(0);
    });
});