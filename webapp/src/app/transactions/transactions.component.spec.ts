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
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
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

  it('opens the mobile editor on a double click in a narrow browser', () => {
    vi.useFakeTimers();
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const transaction = createTransaction();

    component.onMobileMouseClick(transaction, 'amount', mouseEvent('click', 1));
    component.onMobileMouseClick(transaction, 'amount', mouseEvent('click', 2));
    vi.runAllTimers();

    expect(component.mobileEditDialogVisible).toBe(true);
    expect(component.mobileEditField).toBe('amount');
    vi.useRealTimers();
  });

  it('opens category details on a single click in a narrow browser', () => {
    vi.useFakeTimers();
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const transaction = createTransaction();

    component.onMobileMouseClick(transaction, 'category', mouseEvent('click', 1));
    vi.advanceTimersByTime(320);

    expect(component.categoryDialogVisible).toBe(true);
    vi.useRealTimers();
  });

  it('opens description details on a single click in a narrow browser', () => {
    vi.useFakeTimers();
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const transaction = createTransaction();

    component.onMobileMouseClick(
      transaction,
      'description',
      mouseEvent('click', 1),
      transaction.transactionDescription,
    );
    vi.advanceTimersByTime(320);

    expect(component.descriptionDialogVisible).toBe(true);
    vi.useRealTimers();
  });

  it('opens mobile actions after a stationary hold', () => {
    vi.useFakeTimers();
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const transaction = createTransaction();

    component.startMobileEditHold(transaction, 'description', pointerEvent('pointerdown', 1, 20, 20));
    vi.advanceTimersByTime(199);
    expect(component.mobileActionsVisible).toBe(false);
    vi.advanceTimersByTime(1);

    expect(component.mobileActionsVisible).toBe(true);
    expect(component.mobileActionTarget).toBe(transaction);
    vi.useRealTimers();
  });

  it('opens mobile actions after a stationary mouse hold in a narrow browser', () => {
    vi.useFakeTimers();
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const activeTrigger = vi.spyOn(
      component['elementRef'].nativeElement,
      'querySelector',
    ).mockReturnValue({} as Element);
    const transaction = createTransaction();

    component.startMobileMouseHold(
      transaction,
      'description',
      mouseEvent('mousedown', 1),
    );
    vi.advanceTimersByTime(199);
    expect(component.mobileActionsVisible).toBe(false);
    vi.advanceTimersByTime(1);
    vi.advanceTimersByTime(800);
    component.onMobileMouseUp(mouseEvent('mouseup', 1));
    activeTrigger.mockReturnValue(null);

    expect(component.mobileActionsVisible).toBe(true);
    expect(component.mobileActionTarget).toBe(transaction);

    component.onMobileMouseClick(
      transaction,
      'description',
      mouseEvent('click', 1),
      transaction.transactionDescription,
    );
    vi.advanceTimersByTime(320);

    expect(component.mobileActionsVisible).toBe(true);
    expect(component.descriptionDialogVisible).toBe(false);
    vi.useRealTimers();
  });

  it.each(['date', 'category', 'amount'] as const)(
    'opens mobile actions when the %s field is held with a mouse',
    (field) => {
      vi.useFakeTimers();
      vi.spyOn(component, 'isMobile').mockReturnValue(true);
      const transaction = createTransaction();

      component.startMobileMouseHold(transaction, field, mouseEvent('mousedown', 1));
      vi.advanceTimersByTime(200);

      expect(component.mobileActionsVisible).toBe(true);
      expect(component.mobileActionField).toBe(field);
      vi.useRealTimers();
    },
  );

  it.each(['date', 'category', 'amount', 'description'] as const)(
    'opens mobile actions when the %s active-state hold completes',
    (field) => {
      vi.spyOn(component, 'isMobile').mockReturnValue(true);
      const transaction = createTransaction();

      component.onMobileHoldAnimationEnd(transaction, field);

      expect(component.mobileActionsVisible).toBe(true);
      expect(component.mobileActionTarget).toBe(transaction);
      expect(component.mobileActionField).toBe(field);
    },
  );

  it('does not close held-field actions when the release click lands on the backdrop', () => {
    vi.useFakeTimers();
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const activeTrigger = vi.spyOn(
      component['elementRef'].nativeElement,
      'querySelector',
    ).mockReturnValue({} as Element);
    const transaction = createTransaction();
    component.startMobileMouseHold(transaction, 'amount', mouseEvent('mousedown', 1));
    vi.advanceTimersByTime(1000);
    component.onDocumentMouseUp();
    activeTrigger.mockReturnValue(null);
    const backdrop = {};
    const event = {
      target: backdrop,
      currentTarget: backdrop,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as MouseEvent;

    component.onMobileOverlayClick(event, 'actions');

    expect(component.mobileActionsVisible).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('allows an intentional backdrop click after hold-release suppression expires', () => {
    vi.useFakeTimers();
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const transaction = createTransaction();
    component.onMobileHoldAnimationEnd(transaction, 'amount');
    vi.advanceTimersByTime(525);
    const backdrop = {};
    const event = {
      target: backdrop,
      currentTarget: backdrop,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as MouseEvent;

    component.onMobileOverlayClick(event, 'actions');

    expect(component.mobileActionsVisible).toBe(false);
    vi.useRealTimers();
  });

  it('cancels a mobile hold when the pointer moves to scroll', () => {
    vi.useFakeTimers();
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const transaction = createTransaction();

    component.startMobileEditHold(transaction, 'description', pointerEvent('pointerdown', 1, 20, 20));
    component.onMobileEditPointerMove(pointerEvent('pointermove', 1, 20, 40));
    vi.advanceTimersByTime(200);
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

  it('closes a mobile popup when the backdrop is clicked', () => {
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    component.descriptionDialogVisible = true;
    const backdrop = {};
    const event = {
      target: backdrop,
      currentTarget: backdrop,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as MouseEvent;

    component.onMobileOverlayClick(event, 'description');

    expect(component.descriptionDialogVisible).toBe(false);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('keeps a mobile popup open when its content is clicked', () => {
    component.descriptionDialogVisible = true;
    const event = {
      target: {},
      currentTarget: {},
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as MouseEvent;

    component.onMobileOverlayClick(event, 'description');

    expect(component.descriptionDialogVisible).toBe(true);
  });

  it('does not consume the first tap after dismissing an overlay', () => {
    vi.useFakeTimers();
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    component.mobileActionsVisible = true;
    const backdrop = {};
    component.onMobileOverlayTouchStart({
      target: backdrop,
      currentTarget: backdrop,
      changedTouches: [{ identifier: 7 }],
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as TouchEvent, 'actions');
    const transaction = createTransaction();

    component.startMobileEditHold(
      transaction,
      'description',
      pointerEvent('pointerdown', 7, 20, 20),
    );
    component.onDescriptionPointerUp(
      transaction,
      pointerEvent('pointerup', 7, 20, 20),
      transaction.transactionDescription,
      true,
    );
    vi.advanceTimersByTime(320);

    expect(component.descriptionDialogVisible).toBe(true);
    vi.useRealTimers();
  });

  it('suppresses the compatibility click after a stationary touch', () => {
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const transaction = createTransaction();
    const up = pointerEvent('pointerup', 1, 20, 20);

    component.startMobileEditHold(
      transaction,
      'amount',
      pointerEvent('pointerdown', 1, 20, 20),
    );
    component.onMobileEditPointerUp(transaction, 'amount', up, true);

    expect(up.preventDefault).toHaveBeenCalled();
    expect(up.stopPropagation).toHaveBeenCalled();
  });

  it('scrolls the page when a touch moves over a transaction cell', () => {
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const transaction = createTransaction();
    const start = touchEvent(1, 20, 100);
    const move = touchEvent(1, 20, 70);

    component.startMobileEditTouchHold(transaction, 'description', start);
    component.onMobileEditTouchMove(move);

    expect(start.preventDefault).toHaveBeenCalled();
    expect(move.preventDefault).toHaveBeenCalled();
    expect(window.scrollBy).toHaveBeenCalledWith(0, 30);
  });

  it('does not navigate browser history when closing a mobile popup', () => {
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const pushState = vi.spyOn(window.history, 'pushState');
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});

    component.openDescriptionDialog(new Event('click'), 'Description');
    component.closeDescriptionDialog();

    expect(pushState).not.toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
  });

  it('clears input focus when a mobile editor closes', () => {
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    component.mobileEditDialogVisible = true;

    component.cancelMobileFieldEdit();

    expect(document.activeElement).not.toBe(input);
    input.remove();
  });

  it('keeps the page at the editor opening position when it closes', () => {
    vi.spyOn(component, 'isMobile').mockReturnValue(true);
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    component['mobileEditorScrollPosition'] = { x: 0, y: 640 };
    component.mobileEditDialogVisible = true;

    component.cancelMobileFieldEdit();

    expect(scrollTo).toHaveBeenCalledWith(0, 640);
    vi.unstubAllGlobals();
  });
});

function pointerEvent(
  type: string,
  pointerId: number,
  clientX: number,
  clientY: number,
  pointerType: 'touch' | 'mouse' = 'touch',
): PointerEvent {
  return {
    type,
    pointerId,
    pointerType,
    clientX,
    clientY,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as PointerEvent;
}

function touchEvent(identifier: number, clientX: number, clientY: number): TouchEvent {
  return {
    changedTouches: [{ identifier, clientX, clientY }],
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as TouchEvent;
}

function mouseEvent(type: string, detail: number): MouseEvent {
  return {
    type,
    detail,
    button: 0,
    clientX: 20,
    clientY: 20,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as MouseEvent;
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
