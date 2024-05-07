module default {
    scalar type EventLevel extending enum<Test, Practice, Qual, Elim>;

    type Match {
        required matchNumber: int16;
        required eventLevel: EventLevel;
        required event: Event;
    }


    type Team {
        required number: int16;
        required name: str;
        multi events: Event;
    }

    type Event {
        required name: str;
        multi link matches := Match<event[is Match];
        multi link teams := Team<events[is Team];
    }
}
