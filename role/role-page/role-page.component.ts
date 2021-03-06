import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AsyncSubject, Subscription } from 'rxjs';
import { switchMap, throttleTime } from 'rxjs/operators';

import { AppService } from '@vanx/framework';
import { PermissionService } from '@vanx/framework/permission';
import { ResourceService } from '@vanx/framework/resource';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTreeComponent, NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { BitService } from 'ngx-bit';
import { asyncValidator } from 'ngx-bit/operates';
import { BitSwalService } from 'ngx-bit/swal';

import { RoleService } from '../role.service';
import * as packer from './language';

@Component({
  selector: 'v-role-page',
  templateUrl: './role-page.component.html'
})
export class RolePageComponent implements OnInit, AfterViewInit, OnDestroy {
  private id!: number;
  private dataAsync: AsyncSubject<void> = new AsyncSubject();
  private keyAsync!: AsyncSubject<any>;

  @ViewChild('nzTree') nzTree!: NzTreeComponent;
  private resource: string[] = [];
  nodes: NzTreeNodeOptions[] = [];
  permissionLists: any[] = [];
  form!: FormGroup;

  private localeChanged!: Subscription;

  constructor(
    public bit: BitService,
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private swal: BitSwalService,
    private roleService: RoleService,
    private resourceService: ResourceService,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private app: AppService
  ) {}

  ngOnInit(): void {
    this.bit.registerLocales(packer);
    this.form = this.fb.group({
      name: this.bit.i18nGroup({
        validate: {
          zh_cn: [Validators.required]
        }
      }),
      key: [null, [Validators.required], [this.existsKey]],
      permission: [null],
      note: [null],
      status: [true, [Validators.required]]
    });
    this.getNodes();
    this.getPermission();
    this.localeChanged = this.bit.localeChanged!.subscribe(() => {
      this.getNodes();
    });
    this.route.params.subscribe(param => {
      if (param.id) {
        this.id = param.id;
        this.getData();
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataAsync.pipe(throttleTime(200)).subscribe(() => {
      const resource = this.resource;
      const queue = [...this.nzTree.getTreeNodes()];
      while (queue.length !== 0) {
        const node = queue.pop()!;
        node.isChecked = resource.indexOf(node.key) !== -1;
        const parent = node.parentNode;
        if (parent) {
          parent.isChecked = parent.getChildren().every(v => resource.indexOf(v.key) !== -1);
          parent.isHalfChecked = !parent.isChecked && parent.getChildren().some(v => resource.indexOf(v.key) !== -1);
        }
        const children = node.getChildren();
        if (children.length !== 0) {
          queue.push(...children);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.localeChanged.unsubscribe();
  }

  existsKey = (control: AbstractControl) => {
    return asyncValidator(this.roleService.validedKey(control.value, this.keyAsync));
  };

  getData(): void {
    this.keyAsync = new AsyncSubject();
    this.roleService.api.get(this.id).subscribe((data: any) => {
      this.resource = data.resource ? data.resource.split(',') : '';
      this.dataAsync.next();
      this.dataAsync.complete();
      this.keyAsync.next(data.key);
      this.keyAsync.complete();
      this.form.patchValue({
        name: JSON.parse(data.name),
        key: data.key,
        permission: data.permission ? data.permission.split(',') : [],
        note: data.note,
        status: data.status
      });
    });
  }

  /**
   * 获取资源策略节点
   */
  getNodes(): void {
    this.resourceService.api.originLists().subscribe((data: any) => {
      const refer: Map<string, NzTreeNodeOptions> = new Map();
      const lists = data.map((v: any) => {
        const rows = {
          title: `${JSON.parse(v.name)[this.bit.locale!]}[${v.key}]`,
          key: v.key,
          parent: v.parent,
          children: [],
          isLeaf: true
        };
        refer.set(v.key, rows);
        return rows;
      });
      const nodes: any[] = [];
      for (const x of lists) {
        if (x.parent === 'origin') {
          nodes.push(x);
        } else {
          const parent = x.parent;
          if (refer.has(parent)) {
            const rows = refer.get(parent)!;
            rows.isLeaf = false;
            rows.children!.push(x);
            refer.set(parent, rows);
          }
        }
      }
      this.nodes = nodes;
    });
  }

  /**
   * 获取特殊授权
   */
  getPermission(): void {
    this.permissionService.api.originLists().subscribe((data: any) => {
      this.permissionLists = data;
    });
  }

  /**
   * 获取资源键
   */
  setResource(): void {
    this.resource = [];
    const queue = [...this.nzTree.getTreeNodes()];
    while (queue.length !== 0) {
      const node = queue.pop()!;
      if (node.isChecked || node.isHalfChecked) {
        this.resource.push(node.key);
      }
      const children = node.getChildren();
      if (children.length !== 0) {
        queue.push(...children);
      }
    }
  }

  /**
   * 全部选中
   */
  allChecked(): void {
    this.allCheckedStatus(true);
  }

  /**
   * 取消选中
   */
  allUnchecked(): void {
    this.allCheckedStatus(false);
  }

  /**
   * 设置展开状态
   */
  private allCheckedStatus(status: boolean): void {
    const queue = [...this.nzTree.getTreeNodes()];
    while (queue.length !== 0) {
      const node = queue.pop()!;
      node.isHalfChecked = false;
      node.isChecked = status;
      const children = node.getChildren();
      if (children.length !== 0) {
        queue.push(...children);
      }
    }
    this.nzTree.nzCheckBoxChange.emit();
  }

  /**
   * 全部展开
   */
  allExpand(): void {
    this.allExpandStatus(true);
  }

  /**
   * 全部关闭
   */
  allClose(): void {
    this.allExpandStatus(false);
  }

  /**
   * 设置展开状态
   */
  private allExpandStatus(status: boolean): void {
    const queue = [...this.nzTree.getTreeNodes()];
    while (queue.length !== 0) {
      const node = queue.pop()!;
      node.isExpanded = status;
      const children = node.getChildren();
      if (children.length !== 0) {
        queue.push(...children);
      }
    }
  }

  submit = (data: any): void => {
    Reflect.set(data, 'resource', this.resource);
    if (!this.id) {
      this.roleService.api
        .add(data)
        .pipe(
          switchMap((v: any) =>
            this.swal.addAlert(v, this.form, {
              status: true
            })
          )
        )
        .subscribe(() => {});
    } else {
      Reflect.set(data, 'id', this.id);
      this.roleService.api
        .edit(data)
        .pipe(switchMap((v: any) => this.swal.editAlert(v)))
        .subscribe(status => {
          if (status) {
            this.getData();
          }
          this.app.refreshMenuStart();
        });
    }
  };
}
