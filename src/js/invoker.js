'use strict';

var ImageLoader = require('./component/imageLoader');
var Cropper = require('./component/cropper');
var MainComponent = require('./component/main');
var Flip = require('./component/flip');
var Rotation = require('./component/rotation');

/**
 * Invoker
 * @class
 */
var Invoker = tui.util.defineClass(/** @lends Invoker.prototype */{
    init: function() {
        /**
         * Undo stack
         * @type {Array.<Command>}
         */
        this.undoStack = [];

        /**
         * Redo stack
         * @type {Array.<Command>}
         */
        this.redoStack = [];

        /**
         * Component map
         * @type {Object.<string, Component>}
         */
        this.componentMap = {};

        this._createComponents();
    },

    /**
     * Create components
     * @private
     */
    _createComponents: function() {
        var main = new MainComponent();

        this._register(main);
        this._register(new ImageLoader(main));
        this._register(new Cropper(main));
        this._register(new Flip(main));
        this._register(new Rotation(main));
    },

    /**
     * Register component
     * @param {Component} component - Component handling the canvas
     * @private
     */
    _register: function(component) {
        this.componentMap[component.getName()] = component;
    },

    /**
     * Get component
     * @param {string} name - Component name
     * @returns {Component}
     */
    getComponent: function(name) {
        return this.componentMap[name];
    },

    /**
     * Invoke command
     * Store the command to the undoStack
     * Clear the redoStack
     * @param {Command} command - Command
     * @returns {jQuery.Deferred}
     */
    invoke: function(command) {
        var self = this;

        return $.when(command.execute(this.componentMap))
            .done(command.executeCallback)
            .done(function() {
                self.undoStack.push(command);
                self.clearRedoStack();
            });
    },

    /**
     * Undo command
     * @returns {jQuery.Deferred}
     */
    undo: function() {
        var command = this.undoStack.pop();
        var self = this;
        var jqDefer;

        if (command) {
            jqDefer = $.when(command.undo(this.componentMap))
                .done(command.undoCallback)
                .done(function() {
                    self.redoStack.push(command);
                });
        } else {
            jqDefer = $.Deferred().reject();
        }

        return jqDefer;
    },

    /**
     * Redo command
     * @returns {jQuery.Deferred}
     */
    redo: function() {
        var command = this.redoStack.pop();
        var self = this;
        var jqDefer;

        if (command) {
            jqDefer = $.when(command.execute(this.componentMap))
                .done(command.executeCallback)
                .done(function() {
                    self.undoStack.push(command);
                });
        } else {
            jqDefer = $.Deferred().reject();
        }

        return jqDefer;
    },

    /**
     * Return whether the redoStack is empty
     * @returns {boolean}
     */
    isEmptyRedoStack: function() {
        return this.redoStack.length === 0;
    },

    /**
     * Return whether the undoStack is empty
     * @returns {boolean}
     */
    isEmptyUndoStack: function() {
        return this.undoStack.length === 0;
    },

    /**
     * Clear undoStack
     */
    clearUndoStack: function() {
        this.undoStack = [];
    },

    /**
     * Clear redoStack
     */
    clearRedoStack: function() {
        this.redoStack = [];
    }
});

module.exports = Invoker;
