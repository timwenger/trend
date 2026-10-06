import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { Transaction } from '../transaction';

import { TransactionsComponent } from './transactions.component';

describe('TransactionsComponent', () => {
  let component: TransactionsComponent;
  let fixture: ComponentFixture<TransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [TransactionsComponent],
    providers: [ConfirmationService],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens the mobile editor on a double tap', () => {
    vi.useFakeTimers();
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const transaction = createTransaction();

    component.startMobileEditHold(transaction, 'amount', pointerEvent('pointerdown', 1, 20, 20));
    component.onMobileEditPointerUp(transaction, 'amount', pointerEvent('pointerup', 1, 20, 20), true);
    component.startMobileEditHold(transaction, 'amount', pointerEvent('pointerdown', 2, 20, 20));
    component.onMobileEditPointerUp(transaction, 'amount', pointerEvent('pointerup', 2, 20, 20), true);
    vi.runAllTimers();

    expect(component.mobileEditDialogVisible).toBe(true);
    expect(component.mobileEditField).toBe('amount');
    vi.useRealTimers();
  });

  it('opens mobile actions after a stationary hold', () => {
    vi.useFakeTimers();
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const transaction = createTransaction();

    component.startMobileEditHold(transaction, 'description', pointerEvent('pointerdown', 1, 20, 20));
    vi.advanceTimersByTime(450);

    expect(component.mobileActionsVisible).toBe(true);
    expect(component.mobileActionTarget).toBe(transaction);
    vi.useRealTimers();
  });

  it('cancels a mobile hold when the pointer moves to scroll', () => {
    vi.useFakeTimers();
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const transaction = createTransaction();

    component.startMobileEditHold(transaction, 'description', pointerEvent('pointerdown', 1, 20, 20));
    component.onMobileEditPointerMove(pointerEvent('pointermove', 1, 20, 40));
    vi.advanceTimersByTime(450);
    component.onDescriptionPointerUp(transaction, pointerEvent('pointerup', 1, 20, 40), 'Description', true);

    expect(component.mobileActionsVisible).toBe(false);
    expect(component.descriptionDialogVisible).toBe(false);
    vi.useRealTimers();
  });

  it('closes mobile actions when the touch starts on the backdrop', () => {
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    component.mobileActionsVisible = true;
    const backdrop = {};
    const event = {
      target: backdrop,
      currentTarget: backdrop,
      changedTouches: [{ identifier: 7 }],
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as TouchEvent;

    component.onMobileOverlayTouchStart(event, 'actions');

    expect(component.mobileActionsVisible).toBe(false);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });
});

function pointerEvent(type: string, pointerId: number, clientX: number, clientY: number): PointerEvent {
  return {
    type,
    pointerId,
    pointerType: 'touch',
    clientX,
    clientY,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as PointerEvent;
}

function createTransaction(): Transaction {
  return {
    id: 'transaction-1',
    dateTimeWhenRecorded: new Date(2026, 9, 5),
    dateOfTransaction: new Date(2026, 9, 5),
    amount: 42,
    transactionDescription: 'Description',
    categories: [],
  };
}
