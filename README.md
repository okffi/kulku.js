# kulku.js

Process mobility data to understand and predict movements.

Current features:
- Estimate when an itinerary segment has been passed.
- Calculate the average speed on passed itinerary segments.
- Only pure functions for now.


## Setup

The code in `src/` is written in ES6 and transpiled to ES5.

```sh
npm install -g gulp
npm install
gulp test
gulp build
```

The compiled ES5 is saved into the directory `lib/`.


## Glossary

- *Itinerary*: A planned sequence of movements from source to destination.
  If we call an OpenTripPlanner response `r`, then the format is the same as e.g. `r.plan.itineraries[0]`.
- *Itinerary LineString* or just LineString: The legs of an itinerary catenated.
  GeoJSON LineString format.
- *Node*: A Point on the itinerary LineString.
  In GeoJSON Point format.
- *Segment*: Two sequential nodes from a LineString.
- *Timestamp*: A Date object.
- *Fix*: A timestamped GPS location fix and possibly extra properties.
  GeoJSON Point format with a required property `'timestamp'`.
- *Journey*: The entire travel to a destination, as understood by a human being.
  Walking from home to work can be seen as one journey.
  Alternatively journey can be seen as the sequence of movements to get to a destination,
  or the relevant raw and processed mobility sensor data.
  This is just a fluffy concept now without any specific data format.
  A journey might have zero or more itineraries connected to it as plans are formed and changed.
