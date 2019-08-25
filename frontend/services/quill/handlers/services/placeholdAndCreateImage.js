import Delta from 'quill-delta';
import Parchment from 'parchment';

import fromFileToDataUrl from '~/services/fromFileToDataUrl';
import preloadImage from '~/services/preloadImage';
import FileApi from '~/api/FileApi';

const placeholdAndCreateImage = (file, quill, { onSuccess = () => {} } = {}) => {
  // needed for quill.getSelection() to work
  quill.focus();
  const selectionAt = quill.getSelection() ?
    quill.getSelection().index :
    // when we are not focused on the editor (e.g. when we just drop something)
    quill.getLength();

  // => 'placeholder-624608'
  const randomId = 'placeholder-' + String(Math.floor(Math.random() * 1000000));

  fromFileToDataUrl(file, (dataUrl) => {
    quill.updateContents(
      new Delta()
        .retain(selectionAt)
        .insert({ loadingImage: { src: dataUrl, className: 'placeholder-for-loading-image', id: randomId } })
    );
    FileApi.upload(false, file)
      .then((response) => {
        preloadImage(response.url, () => {
          const placeholderEl = quill.container.querySelector(`section.placeholder-for-loading-image[data-id="${randomId}"]`);

          // Will be false when we save a new card, and quill container el changes.
          if (placeholderEl) {
            const blot = Parchment.find(placeholderEl);
            const index = blot.offset(quill.scroll);

            quill.updateContents(
              new Delta()
                .retain(index)
                .delete(2) // delete the placeholder (I'm not sure why .delete(1) doesn't work)
                .insert({ image: response.url })
            );

            onSuccess();
          }
        });
      });
  });
};

export default placeholdAndCreateImage;
