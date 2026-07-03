/**
 * A collection class that extends the built-in Map class, providing additional utility methods for managing key-value pairs.
 * @template K - The type of keys in the collection.
 * @template V - The type of values in the collection.
 * @public
 */
export class Collection<K, V> extends Map<K, V> {
    /**
     * Retrieves the first value in the collection that satisfies the provided predicate function.
     * @param predicate - A function that tests each value in the collection.
     * @returns The first value that satisfies the predicate, or undefined if none do.
     */
    public find(predicate: (value: V, key: K) => boolean): V | undefined {
        for (const [key, value] of this) {
            if (predicate(value, key)) {
                return value;
            }
        }
        return undefined;
    }

    /**
     * Filters the collection based on a provided predicate function, returning a new collection containing only the entries that satisfy the predicate.
     * @param predicate - A function that tests each value in the collection.
     * @returns A new Collection instance containing only the entries that satisfy the predicate.
     */
    public filter(predicate: (value: V, key: K) => boolean): Collection<K, V> {
        const filtered = new Collection<K, V>();
        for (const [key, value] of this) {
            if (predicate(value, key)) {
                filtered.set(key, value);
            }
        }
        return filtered;
    }
}