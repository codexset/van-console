import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BitService, BitSwalService } from 'ngx-bit';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { asyncValidator } from 'ngx-bit/operates';
import { switchMap } from 'rxjs/operators';
import { SchemaService } from '../schema.service';
import { SchemaType } from '../schema-type';
import * as packer from './language';

@Component({
  selector: 'van-schema-add',
  templateUrl: './schema-add.component.html'
})
export class SchemaAddComponent implements OnInit {
  form: FormGroup;
  type: any[] = Object.values(SchemaType);

  constructor(
    public bit: BitService,
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private swal: BitSwalService,
    private schemaService: SchemaService
  ) {
  }

  ngOnInit(): void {
    this.bit.registerLocales(packer);
    this.form = this.fb.group({
      name: this.fb.group(this.bit.i18nGroup({
        validate: {
          zh_cn: [Validators.required]
        }
      })),
      table: [null, [Validators.required], [this.existsTable]],
      type: [null, [Validators.required]],
      description: [null],
      status: [true, [Validators.required]]
    });
  }

  existsTable = (control: AbstractControl) => {
    return asyncValidator(this.schemaService.validedTable(control.value));
  };

  /**
   * 提交
   */
  submit(data): void {
    this.schemaService.add(data).pipe(
      switchMap(res => this.swal.addAlert(res, this.form, {
        status: true
      }))
    ).subscribe(() => {
    });
  }
}