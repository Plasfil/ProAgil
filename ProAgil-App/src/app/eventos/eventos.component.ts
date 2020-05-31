import { Component, OnInit, TemplateRef } from '@angular/core';
import { EventoService } from '../_services/evento.service';
import { Evento } from '../_models/Evento';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { defineLocale } from 'ngx-bootstrap/chronos';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { ptBrLocale } from 'ngx-bootstrap/locale';
import { templateJitUrl } from '@angular/compiler';

defineLocale('pt', ptBrLocale);

@Component({
  selector: 'app-eventos',
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.css']
})
export class EventosComponent implements OnInit {
  titulo = 'Eventos';

  eventosFiltrados: Evento[];
  eventos: Evento[];
  evento: Evento;

  modoSalvar = 'put';
  bodyDeletarEvento = '';
  dataEvento = '';

  imagemLargura = 50;
  imagemMargem = 2;
  mostrarImagem = false;
  modalRef: BsModalRef;
  registerForm: FormGroup;

  file: File;

  _filtroLista = '';

  fileNameToUpdate: string;
  dataAtual: string;

  constructor(
      private eventoService: EventoService
    , private modalService: BsModalService
    , private fb: FormBuilder
    , private localeServcice: BsLocaleService
    , private toastr: ToastrService
    ) {
      this.localeServcice.use('pt');
    }

  get filtroLista(): string {
    return this._filtroLista;
  }

  set filtroLista(value: string) {
    this._filtroLista = value;
    this.eventosFiltrados = this.filtroLista ? this.filtrarEventos(this.filtroLista) : this.eventos;
  }

  novoEvento(template: any) {
    this.modoSalvar = 'post';
    this.openModal(template);
  }

  editarEvento(template: any, evento: Evento) {
    this.modoSalvar = 'put';
    this.openModal(template);
    this.evento = Object.assign({}, evento);
    this.fileNameToUpdate = evento.imagemUrl.toString();
    this.evento.imagemUrl = '';

    this.registerForm.patchValue(this.evento);
  }

  excluirEvento(evento: Evento, template: any) {
    this.openModal(template);
    this.evento = evento;
    this.bodyDeletarEvento = `Tem certeza que deseja excluir o Evento: ${evento.tema}, Código: ${evento.id}`;
  }

  confirmeDelete(template: any) {
    console.log(this.evento.id);
    this.eventoService.deleteEvento(this.evento.id).subscribe(
      () => {
        template.hide();
        this.getEventos();
        this.toastr.success('Registo deletado com sucesso.', 'Alerta!', {
          timeOut: 3000
        });
      }, error => {
        console.log(error);
        this.toastr.error('Houve um problema ao deletar o registo.', 'Alerta!', {
          timeOut: 3000
        });
      }
    );
  }

  openModal(template: any) {
    this.registerForm.reset();
    template.show();
  }

  ngOnInit() {
    this.validation();
    this.getEventos();
  }

  filtrarEventos(filtrarPor: string): Evento[] {
    filtrarPor = filtrarPor.toLocaleLowerCase();
    return this.eventos.filter(
      evento => evento.tema.toLocaleLowerCase().indexOf(filtrarPor) !== -1
    );
  }

  alterarImagem() {
    this.mostrarImagem = !this.mostrarImagem;
  }

  validation() {
    this.registerForm = this.fb.group({
      tema: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
      local: ['', Validators.required],
      dataEvento: ['', Validators.required],
      qtdPessoas: ['', [Validators.required, Validators.max(120000)]],
      imagemUrl: ['', Validators.required],
      telefone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onFileChange(event) {
    const reader = new FileReader();

    if (event.target.files && event.target.files.length) {
      this.file = event.target.files;
      console.log(this.file);
    }
  }

  uploadFile() {
    if (this.modoSalvar === 'post') {
      const nomeArquivo = this.evento.imagemUrl.split('\\', 3);
      this.evento.imagemUrl = nomeArquivo[2];

      this.eventoService.postUpload(this.file, nomeArquivo[2])
      .subscribe(
        () => {
          this.dataAtual = new Date().getMilliseconds().toString();
          this.getEventos();
        }
      );
    }
    else {
      this.evento.imagemUrl = this.fileNameToUpdate;
      this.eventoService.postUpload(this.file, this.fileNameToUpdate)
      .subscribe(
        () => {
          this.dataAtual = new Date().getMilliseconds().toString();
          this.getEventos();
        }
      );
    }
  }

  salvarAlteracao(template: any){
    if (this.registerForm.valid) {
      if (this.modoSalvar === 'post') {
        this.evento = Object.assign({}, this.registerForm.value);

        this.uploadFile();

        this.eventoService.postEvento(this.evento).subscribe(
          (novoEvento: Evento) => {
            console.log(novoEvento);
            template.hide();
            this.getEventos();
            this.toastr.success('Registo inserido com sucesso.', 'Alerta!', {
              timeOut: 3000
            });
          }, error => {
            console.log(error);
            this.toastr.error('Erro ao inserir novo registo.', 'Alerta!', {
              timeOut: 3000
            });
          }
        );
      }
      else{
        this.evento = Object.assign({id: this.evento.id}, this.registerForm.value);

        this.uploadFile();

        this.eventoService.putEvento(this.evento).subscribe(
          () => {
            template.hide();
            this.getEventos();
            this.toastr.success('Registo editado com sucesso.', 'Alerta!', {
              timeOut: 3000
            });
          }, error => {
            console.log(error);
            this.toastr.error('Erro ao editar novo registo.', 'Alerta!', {
              timeOut: 3000
            });
          }
        );
      }

    }
  }

  getEventos() {
    this.eventoService.getAllEvento().subscribe(
      (_eventos: Evento[]) => {
      this.eventos = _eventos;
      this.eventosFiltrados = this.eventos;
    }, error => {
      this.toastr.error(`Erro ao editar novo registo : ${error}.`, 'Alerta!');
    });
  }

}
