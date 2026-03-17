import { DataPoint, Axis } from "@/types";
import { useState } from "react";

type ChangeType = "cell" | "annotation" | "rowName";

type ChangeStackItem = {
    type: ChangeType;
    rowName: DataPoint["name"];
    // For cell updates
    columnName?: Axis["name"];
    previousValue?: number;
    nextValue?: number;
    // For annotation updates
    previousAnnotation?: string;
    nextAnnotation?: string;
    // For rowName updates
    previousRowName?: string;
    nextRowName?: string;
};

export default function useChangeStack() {
    const [undoStack, setUndoStack] = useState<ChangeStackItem[]>([]);
    const [redoStack, setRedoStack] = useState<ChangeStackItem[]>([]);

    const pushChange = (change: ChangeStackItem) => {
        setUndoStack((prev) => {
            const newStack = prev.length >= 20 ? prev.slice(1) : prev;
            return [...newStack, change];
        });
        setRedoStack([]); // Clear redo stack on new change
    };

    const undo = () => {
        if (undoStack.length === 0) return undefined;
        const lastChange = undoStack[undoStack.length - 1];
        setUndoStack((prev) => prev.slice(0, -1));
        setRedoStack((prev) => [...prev, lastChange]);
        return lastChange;
    };

    const redo = () => {
        if (redoStack.length === 0) return undefined;
        const lastRedo = redoStack[redoStack.length - 1];
        setRedoStack((prev) => prev.slice(0, -1));
        setUndoStack((prev) => [...prev, lastRedo]);
        return lastRedo;
    };

    return {
        pushChange,
        undo,
        redo,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
    };
}