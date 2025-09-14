/**
 * (P) 2019-2025 Lars Ermert
 * v2.3.2 - 25.09.08:
 *    - protecting against 'already defined' error
 * v2.3.1 - 25.08.24:
 *    - added events when opening and closing an entry
 *    - added a wrapper class for all the entries
 * v2.2 - 25.07.23:
 *    - minor tweaks, documentation
 * v2.1 - 25.06.27:
 *    - cleaner debug output
 *    - more descriptive variables
 * v2.0 - 23.01.07:
 *    - switched to vanilla js
 *
 *    HTML Structure:
 *    --------------------
 *    <div class="le-accordion">
 *      <div class="le-acc-entries">
 *
 *        <div class="le-acc-entry -with-arrow">
 *          <div class="le-acc-header">TITLE 1</div>
 *          <div class="le-acc-content">CONTENT 1</div>
 *        </div>
 *
 *        <div class="le-acc-entry -with-arrow">
 *          <div class="le-acc-header">TITLE 2</div>
 *          <div class="le-acc-content">CONTENT 2</div>
 *        </div>
 *
 *      </div>
 *    </div>
 */

if (typeof window.LeAccordion === 'undefined') {

    window.LeAccordion = class {

        constructor(options) {

            this._setup(options);

            this._log('constructor( options )', options, this.options);

        }

        _setup( options ) {

            this.options = {
                wrapper_class: 'le-accordion',
                entry_class: 'le-acc-entry',
                header_class: 'le-acc-header',
                content_class: 'le-acc-content',
                data_max_height_tag: 'le-acc-max-height',
                data_min_height_tag: 'le-acc-min-height',
                only_one_open: false,
                debug: false
            };

            if (options !== undefined) {
                Object.assign(this.options, options);
            }

            this.options.selector = {
                wrapper_class: '.' + this.options.wrapper_class,
                entry_class: '.' + this.options.entry_class,
                header_class: '.' + this.options.header_class,
                header: '.'+this.options.wrapper_class+' .'+this.options.header_class
            }

        }

        /**
         * Assigns click event listeners to elements matching the header selector specified in options.
         * Handles the toggling of accordion elements' open/close states, with respect to configuration options such as `only_one_open`.
         * Applies necessary changes to element classes for styling and layout adjustments.
         *
         * @return {void} This method does not return any value.
         */
        _setClickEvents() {
            this._log('_setOpenEvents()');
            this._log('header selector = "' + this.options.selector.header + '"', document.querySelector('.'+this.options.wrapper_class+' .'+this.options.header_class));

            document.querySelectorAll( this.options.selector.header ).forEach( (ele, index) => {

                this._log('FOUND element > ', ele, index);

                ele.addEventListener('click', (event) => {
                    this._log('header clicked');

                    let target_ele = event.target.closest( this.options.selector.header_class );
                    let parent_ele = target_ele.parentElement;
                    let izOpen = parent_ele.classList.contains('-open');

// reset all if so wished
                    if (this.options.only_one_open) {
                        const entry_ele = document.querySelector( this.options.selector.entry_class );
                        if (entry_ele) {
                            document.querySelector( this.options.selector.entry_class ).classList.remove('-open');
                        }
                        if (parent_ele) {
                            const header_ele = parent_ele.parentElement.querySelector('.m3acc-header');
                            if (header_ele) {
                                header_ele.classList.remove('_primary-bkgr');
                            }
                        }
                    }

// add to current if it was closed before
                    if (!izOpen) {
                        parent_ele.classList.add('-open');
                        target_ele.classList.add('_primary-bkgr');
                        this.emitEvent(target_ele, 'accordion-entry-open');
                    } else {
                        parent_ele.classList.remove('-open');
                        target_ele.classList.remove('_primary-bkgr');
                        this.emitEvent(target_ele, 'accordion-entry-close');
                    }

// apply the changes
                    this._setMaxHeight();
                });
            });
        }

        emitEvent(element, event_type) {
            if (element === null) {
                console.log('LeAccordion > emitEvent: element is null');
                return;
            }
            const accordion_ele = element.closest('.'+this.options.wrapper_class);
            if (accordion_ele) {
                accordion_ele.dispatchEvent(new CustomEvent(event_type,{ detail: {target_entry: element }}));
            }
        }

        init() {
            this._log('init()');

// show content by adding the -initialized class
            document.querySelectorAll( this.options.selector.header ).forEach((content, index) => {
                content.classList.add('-initialized');
            });

            this._setClickEvents();

            addEventListener("resize",  () => {
                this._calculateHeights();
                this._setMaxHeight();
            })
            this._calculateHeights();

            this._setMaxHeight();


            const accordion_ele = document.querySelector( this.options.selector.wrapper_class );
            if (accordion_ele) {
                this.emitEvent( accordion_ele, 'accordion-initialized' );
                setTimeout(() => {
                    accordion_ele.classList.add('-initialized');
                }, 250)
            }
        }


        /**
         * Calculates the max- and min-height for each entry based on the height of the title and content
         * @private
         */
        _calculateHeights() {
            this._log('_calculateHeights()');
            document.querySelectorAll('.'+this.options.wrapper_class+' .'+this.options.content_class).forEach((content, index) => {
                let parent_ele = content.parentElement;
                let title_ele = parent_ele.querySelector('.'+this.options.header_class);
                this._log(content, content.offsetHeight, title_ele.offsetHeight);
                if (parent_ele && title_ele) {
                    this._log('title_height, content_height > ', title_ele.offsetHeight, content.offsetHeight + title_ele.offsetHeight);
                    parent_ele.setAttribute('data-' + this.options.data_min_height_tag, title_ele.offsetHeight);
                    parent_ele.setAttribute('data-' + this.options.data_max_height_tag, content.offsetHeight + title_ele.offsetHeight);
                } else {
                    this._log('_calculateHeights() - title and parent not found', title_ele, parent_ele);
                }
            })
        }


        /**
         * Calculates the max-height for each entry based on the data-m3acc-max-height value
         * @private
         */
        _setMaxHeight() {
            this._log('_setMaxHeight()');
            document.querySelectorAll('.'+this.options.entry_class).forEach((entry, index ) => {
                if (entry.classList.contains('-open')) {
                    entry.style.maxHeight = entry.getAttribute('data-'+this.options.data_max_height_tag) + 'px';
                } else {
                    entry.style.maxHeight = entry.getAttribute('data-'+this.options.data_min_height_tag) + 'px';
                }
            });
        }

        _log() {
            if (this.options.debug) {
                console.log('LeAccordion: ', ...arguments);
            }
        }

    }

} else {
    console.info('LeAccordion already defined');
}