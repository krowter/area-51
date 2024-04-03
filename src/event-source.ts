export class EventSource<
  EventItem extends { type: string; payload: unknown[] }
> {
  private events: EventItem[] = [];

  /**
   * pointer to which state is currently drawn
   * 
   * when appending new events, increment by 1
   * 
   * when undoing, all events/changes from initial state 
   * up until this index - 1 will be applied, decrement by 1
   */
  private currentIndex = 0;

  constructor(
    private actionByType: Record<
      string,
      (...args: EventItem["payload"]) => void
    >
  ) {}

  /**
   * allow consumer to use their own resetter
   * before changes are applied when calling undo()
   */
  resetState: (() => void) | undefined;

  append(event: EventItem) {
    this.events[this.currentIndex] = event;
    this.actionByType[event.type].apply(null, event.payload);

    this.currentIndex += 1;
  }

  undo() {
    if (this.currentIndex === 0) return;

    if (this.resetState !== undefined) this.resetState();

    this.events
      .slice(0, this.currentIndex - 1)
      .forEach((event) =>
        this.actionByType[event.type].apply(null, event.payload)
      );

    this.currentIndex -= 1;
  }

  redo() {
    const nextEvent = this.events[this.currentIndex];

    if (nextEvent === undefined) return;

    this.actionByType[nextEvent.type].apply(null, nextEvent.payload);

    this.currentIndex += 1;
  }
}
