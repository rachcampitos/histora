import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { TableCardComponent } from './table-card.component';

interface TestData {
  id: number;
  name: string;
}

describe('TableCardComponent', () => {
  let component: TableCardComponent<TestData>;
  let fixture: ComponentFixture<TableCardComponent<TestData>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCardComponent, NoopAnimationsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableCardComponent<TestData>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
