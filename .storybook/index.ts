import { view } from './storybook.requires';

const StorybookUIRoot = view.getStorybookUI({
    shouldPersistSelection: true,
    onDeviceUI: true,
});

export default StorybookUIRoot;
