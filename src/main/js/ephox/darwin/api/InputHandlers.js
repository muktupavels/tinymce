define(
  'ephox.darwin.api.InputHandlers',

  [
    'ephox.darwin.api.Responses',
    'ephox.darwin.api.SelectionKeys',
    'ephox.darwin.api.WindowBridge',
    'ephox.darwin.keyboard.KeySelection',
    'ephox.darwin.keyboard.VerticalMovement',
    'ephox.darwin.mouse.MouseSelection',
    'ephox.darwin.navigation.KeyDirection',
    'ephox.darwin.selection.CellSelection',
    'ephox.katamari.api.Fun',
    'ephox.katamari.api.Option',
    'ephox.katamari.api.Options',
    'ephox.katamari.api.Struct',
    'ephox.sugar.api.selection.Situ'
  ],

  function (Responses, SelectionKeys, WindowBridge, KeySelection, VerticalMovement, MouseSelection, KeyDirection, CellSelection, Fun, Option, Options, Struct, Situ) {
    var rc = Struct.immutable('rows', 'cols');

    var mouse = function (win, container, isRoot, annotations) {
      var bridge = WindowBridge(win);

      var handlers = MouseSelection(bridge, container, isRoot, annotations);

      return {
        mousedown: handlers.mousedown,
        mouseover: handlers.mouseover,
        mouseup: handlers.mouseup
      };
    };

    var keyboard = function (win, container, isRoot, annotations) {
      var bridge = WindowBridge(win);

      var clearToNavigate = function () {
        annotations.clear(container);
        return Option.none();
      };

      var keydown = function (event, start, soffset, finish, foffset, direction) {
        var keycode = event.raw().which;
        var shiftKey = event.raw().shiftKey === true;

        var handler = CellSelection.retrieve(container, annotations.selectedSelector()).fold(function () {
          // Shift down should predict the movement and set the selection.
          if (SelectionKeys.isDown(keycode) && shiftKey) {
            return Fun.curry(VerticalMovement.select, bridge, container, isRoot, KeyDirection.down, finish, start, annotations.selectRange);
          }
          // Shift up should predict the movement and set the selection.
          else if (SelectionKeys.isUp(keycode) && shiftKey) {
            return Fun.curry(VerticalMovement.select, bridge, container, isRoot, KeyDirection.up, finish, start, annotations.selectRange);
          }
          // Down should predict the movement and set the cursor
          else if (SelectionKeys.isDown(keycode)) {
            return Fun.curry(VerticalMovement.navigate, bridge, isRoot, KeyDirection.down, finish, start);
          }
          // Up should predict the movement and set the cursor
          else if (SelectionKeys.isUp(keycode)) {
            return Fun.curry(VerticalMovement.navigate, bridge, isRoot, KeyDirection.up, finish, start);
          }
          else {
            return Option.none;
          }
        }, function (selected) {

          var update = function (attempts) {
            return function () {
              var navigation = Options.findMap(attempts, function (delta) {
                return KeySelection.update(delta.rows(), delta.cols(), container, selected, annotations);
              });

              // Shift the selected rows and update the selection.
              return navigation.fold(function () {
                // The cell selection went outside the table, so clear it and bridge from the first box to before/after
                // the table
                return CellSelection.getEdges(container, annotations.firstSelectedSelector(), annotations.lastSelectedSelector()).map(function (edges) {
                  var relative = SelectionKeys.isDown(keycode) || direction.isForward(keycode) ? Situ.after : Situ.before;
                  bridge.setRelativeSelection(Situ.on(edges.first(), 0), relative(edges.table()));
                  annotations.clear(container);
                  return Responses.response(Option.none(), true);
                });
              }, function (_) {
                return Option.some(Responses.response(Option.none(), true));
              });
            };
          };

          if (SelectionKeys.isDown(keycode) && shiftKey) return update([ rc(+1, 0) ]);
          else if (SelectionKeys.isUp(keycode) && shiftKey) return update([ rc(-1, 0) ]);
          // Left and right should try up/down respectively if they fail.
          else if (direction.isBackward(keycode) && shiftKey) return update([ rc(0, -1), rc(-1, 0) ]);
          else if (direction.isForward(keycode) && shiftKey) return update([ rc(0, +1), rc(+1, 0) ]);
          // Clear the selection on normal arrow keys.
          else if (SelectionKeys.isNavigation(keycode) && shiftKey === false) return clearToNavigate;
          else return Option.none;
        });

        return handler();
      };

      var keyup = function (event, start, soffset, finish, foffset) {
        return CellSelection.retrieve(container, annotations.selectedSelector()).fold(function () {
          var keycode = event.raw().which;
          var shiftKey = event.raw().shiftKey === true;
          if (shiftKey === false) return Option.none();
          if (SelectionKeys.isNavigation(keycode)) return KeySelection.sync(container, isRoot, start, soffset, finish, foffset, annotations.selectRange);
          else return Option.none();
        }, Option.none);
      };

      return {
        keydown: keydown,
        keyup: keyup
      };
    };

    return {
      mouse: mouse,
      keyboard: keyboard
    };
  }
);