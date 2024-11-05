import {
  AlloyComponent,
  AlloyTriggers,
  Disabling,
  Representing,
  SystemEvents
} from '@ephox/alloy';
import { InlineContent } from '@ephox/bridge';
import { Singleton } from '@ephox/katamari';

import { backSlideEvent } from './ContextUi';

export const getFormApi = <T>(input: AlloyComponent): InlineContent.ContextFormInstanceApi<T> => {
  const valueState = Singleton.value<T>();

  return ({
    setInputEnabled: (state: boolean) => Disabling.set(input, !state),
    isInputEnabled: () => !Disabling.isDisabled(input),
    hide: () => {
      // Before we hide snapshot the current value since accessing the value of a form field after it's been detached will throw an error
      if (!valueState.isSet()) {
        valueState.set(Representing.getValue(input));
      }

      AlloyTriggers.emit(input, SystemEvents.sandboxClose());
    },
    back: () => {
      // Before we hide snapshot the current value since accessing the value of a form field after it's been detached will throw an error
      if (!valueState.isSet()) {
        valueState.set(Representing.getValue(input));
      }

      AlloyTriggers.emit(input, backSlideEvent);
      AlloyTriggers.emit(input, SystemEvents.sandboxClose());
    },
    getValue: () => {
      return valueState.get().getOrThunk(() => Representing.getValue(input));
    },
    setValue: (value) => {
      if (valueState.isSet()) {
        valueState.set(value);
      } else {
        Representing.setValue(input, value);
      }
    }
  });
};