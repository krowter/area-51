export class EventSource<EventItem extends { type: string; payload: unknown[] }> {
  events: EventItem[] = [];
  currentIndex = 0;

  constructor(
    private actionByType: Record<
      string,
      (...args: EventItem["payload"]) => void
    >
  ) {}

  resetState() {
    throw new Error("resetState not implemented.");
  }

  append(event: EventItem) {
    this.events[this.currentIndex++] = event;
    this.actionByType[event.type].apply(null, event.payload);
  }

  undo() {
    this.resetState();

    this.events
      .slice(0, this.currentIndex - 1)
      .forEach((event) =>
        this.actionByType[event.type].apply(null, event.payload)
      );

    this.currentIndex -= 1;
  }

  redo() {
    
  }
}
