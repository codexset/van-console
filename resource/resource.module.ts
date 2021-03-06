import { NgModule } from '@angular/core';

import { ShareModule } from '@vanx/framework';
import { FrameworkComponentModule } from '@vanx/framework/component';

import { PolicyService } from './policy.service';
import { ResourceIndexComponent } from './resource-index/resource-index.component';
import { ResourcePageComponent } from './resource-page/resource-page.component';
import { ResourceService } from './resource.service';

@NgModule({
  imports: [ShareModule, FrameworkComponentModule],
  declarations: [ResourceIndexComponent, ResourcePageComponent],
  exports: [ResourceIndexComponent, ResourcePageComponent],
  providers: [ResourceService, PolicyService]
})
export class ResourceModule {}
