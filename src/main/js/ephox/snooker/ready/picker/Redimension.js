define(
  'ephox.snooker.ready.picker.Redimension',

  [
    'ephox.snooker.ready.data.Structs',
    'ephox.snooker.ready.picker.CellPosition',
    'ephox.snooker.ready.picker.Sizing',
    'ephox.sugar.api.Height',
    'ephox.sugar.api.Location',
    'ephox.sugar.api.Width',
    'global!Math'
  ],

  function (Structs, CellPosition, Sizing, Height, Location, Width, Math) {
    return function (settings) {
      var active = false;

      var on = function () {
        active = true;
      };

      var off = function () {
        active = false;
      };

      var getDimensions = function (table) {
        var width = Width.get(table.element());
        var height = Height.get(table.element());
        return Structs.dimensions(width, height);
      };

      var getPosition = function (table) {
        var position = Location.absolute(table.element());
        return Structs.coords(position.left(), position.top());
      };

      var handle = function (table, grid, x, y) {
        if (active) {
          var dimensions = getDimensions(table);
          var position = getPosition(table);
          var mouse = Structs.coords(x, y);
          var address = CellPosition.findCell(position, dimensions, grid, mouse);
          var changes = Sizing.resize(address, settings);
          var full = changes.full();
          if (full.row() !== grid.rows() || full.column() !== grid.columns()) table.setSize(full.row(), full.column());
          table.setSelection(changes.selection().row(), changes.selection().column());
        }
      };

      return {
        on: on,
        off: off,
        handle: handle,
        events: events.registry
      };
    };

  }
);