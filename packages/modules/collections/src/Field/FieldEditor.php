<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Field;

use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Field\Types\ChoiceType;
use Frootbox\Core\Language\Languages;
use Frootbox\Core\ObjectField\ObjectSchema;
use Frootbox\Core\Page\Slug;
use Frootbox\Core\Plugin\PluginSpaces;
use Frootbox\Core\Support\Message;
use Frootbox\Database\EntityNotFoundException;

/**
 * Adds, changes, moves and removes the fields of a collection (decision
 * 0250). Name and kind stay as they were made; values in the entries
 * stay when a field goes.
 */
final readonly class FieldEditor
{
    public const string NAME_PATTERN = '^[a-z][a-zA-Z0-9]{0,39}$';

    private const int LABEL_LENGTH = 100;

    private const int OPTION_LENGTH = 200;

    private const int MAX_OPTIONS = 100;

    public function __construct(
        private CollectionFields $fields,
        private EntryStore $entries,
        private PluginSpaces $spaces,
        private Languages $languages,
        private ObjectSchema $schema,
    ) {}

    /**
     * @param array<mixed>      $labels
     * @param array<mixed>|null $options
     *
     * @throws InvalidInputException
     */
    public function create(string $action, string $space, FieldKind $kind, array $labels, ?array $options, ?string $unit, ?int $decimals, ?string $name): CollectionField
    {
        if (!$this->spaces->exists(EntryStore::TYPE, $space)) {
            throw new InvalidInputException($action, ['/space' => 'There is no such collection.']);
        }

        $checked = $this->labels($action, $labels, []);
        $default = $this->languages->default()->code;

        if (!isset($checked[$default])) {
            throw new InvalidInputException($action, ['/labels/' . $default => new Message('is missing: the label in {language}.', ['language' => $this->languages->default()->title])]);
        }

        $taken = $this->taken($space);

        if (null !== $name) {
            if (isset($taken[$name])) {
                throw new InvalidInputException($action, ['/name' => new Message('The collection or the theme has a field "{name}" already.', ['name' => $name])]);
            }
        } else {
            $name = self::nameFor($checked[$default], $default, $taken);
        }

        $field = $this->fields->insert([
            'space' => $space,
            'name' => $name,
            'type' => $kind->value,
            'labels' => $checked,
            'settings' => $this->settings($action, $kind, [], $options, $unit, $decimals, true),
            'position' => \count($this->fields->ofSpace($space)),
        ]);
        $this->schema->reset();

        return $field;
    }

    /**
     * @param array<mixed>|null $labels
     * @param array<mixed>|null $options
     *
     * @throws InvalidInputException
     */
    public function update(string $action, string $space, string $name, ?array $labels, ?array $options, ?string $unit, ?int $decimals): CollectionField
    {
        $field = $this->get($space, $name);
        $values = [];

        if (null !== $labels) {
            $values['labels'] = $this->labels($action, $labels, $field->labels());

            if (!isset($values['labels'][$this->languages->default()->code])) {
                throw new InvalidInputException($action, ['/labels/' . $this->languages->default()->code => new Message('cannot be empty: the label in {language}.', ['language' => $this->languages->default()->title])]);
            }
        }

        if (null !== $options || null !== $unit || null !== $decimals) {
            $values['settings'] = $this->settings($action, $field->kind(), $field->settings, $options, $unit, $decimals, false, $field);
        }

        $changed = [] === $values ? $field : $this->fields->update($field->id, $values);
        $this->schema->reset();

        return $changed;
    }

    /**
     * @throws InvalidInputException
     */
    public function move(string $action, string $space, string $name, int $position): CollectionField
    {
        $field = $this->get($space, $name);
        $others = array_values(array_filter($this->fields->ofSpace($space), static fn(CollectionField $other): bool => $other->id !== $field->id));
        array_splice($others, max(0, min($position, \count($others))), 0, [$field]);
        $this->positions($others);
        $this->schema->reset();

        return $this->fields->getById($field->id);
    }

    /**
     * @throws InvalidInputException
     */
    public function delete(string $action, string $space, string $name): void
    {
        $field = $this->get($space, $name);
        $this->fields->delete($field->id);
        $this->positions($this->fields->ofSpace($space));
        $this->schema->reset();
    }

    /**
     * @throws EntityNotFoundException
     */
    public function get(string $space, string $name): CollectionField
    {
        return $this->fields->named($space, $name) ?? throw new EntityNotFoundException(\sprintf('The collection "%s" has no field "%s".', $space, $name));
    }

    /**
     * How many entries of the collection have a value in a field, drafts
     * included.
     *
     * @return array<string, int> By name of the field
     */
    public function used(string $space): array
    {
        $used = [];

        foreach ($this->entries->ids() as $id) {
            $data = $this->entries->current($id);

            if ($data->space !== $space) {
                continue;
            }

            foreach ($data->fields as $name => $value) {
                if (null !== $value) {
                    $used[(string) $name] = ($used[(string) $name] ?? 0) + 1;
                }
            }
        }

        return $used;
    }

    /**
     * @param list<CollectionField> $fields
     */
    private function positions(array $fields): void
    {
        foreach ($fields as $position => $field) {
            if ($field->position !== $position) {
                $this->fields->update($field->id, ['position' => $position]);
            }
        }
    }

    /**
     * Names in use: fields of the collection and those of the theme.
     *
     * @return array<string, true>
     */
    private function taken(string $space): array
    {
        $taken = array_fill_keys(array_keys($this->schema->fields(EntryStore::TYPE)), true);

        foreach ($this->fields->ofSpace($space) as $field) {
            $taken[$field->name] = true;
        }

        return $taken;
    }

    /**
     * A name from the label, e.g. "altitudeAboveSeaLevel".
     *
     * @param array<string, true> $taken
     */
    private static function nameFor(string $label, string $language, array $taken): string
    {
        $parts = array_values(array_filter(explode('-', Slug::fromTitle($label, $language)), static fn(string $part): bool => 1 === preg_match('/^[a-z0-9]+$/', $part)));
        $name = lcfirst(implode('', array_map(ucfirst(...), $parts)));
        $name = substr(1 === preg_match('/^[a-z]/', $name) ? $name : 'field' . ucfirst($name), 0, 34);
        $unique = $name;

        for ($number = 2; isset($taken[$unique]); ++$number) {
            $unique = $name . $number;
        }

        return $unique;
    }

    /**
     * Labels by language after the input; an empty one removes it.
     *
     * @param array<mixed>          $input
     * @param array<string, string> $current
     *
     * @return array<string, string>
     *
     * @throws InvalidInputException
     */
    private function labels(string $action, array $input, array $current): array
    {
        $errors = [];

        foreach ($input as $language => $label) {
            $language = (string) $language;
            $at = '/labels/' . $language;

            if (!$this->languages->has($language)) {
                $errors[$at] = new Message('There is no language "{language}". Languages: {languages}.', ['language' => $language, 'languages' => implode(', ', $this->languages->codes())]);
            } elseif (null === $label || (\is_string($label) && '' === trim($label))) {
                unset($current[$language]);
            } elseif (!\is_string($label) || mb_strlen(trim($label)) > self::LABEL_LENGTH) {
                $errors[$at] = new Message('must be a text of at most {count} characters.', ['count' => self::LABEL_LENGTH]);
            } else {
                $current[$language] = trim($label);
            }
        }

        if ([] !== $errors) {
            throw new InvalidInputException($action, $errors);
        }

        return $current;
    }

    /**
     * The settings of a kind after the input: unit and decimals of a
     * number, the options of a choice.
     *
     * @param array<mixed>      $current
     * @param array<mixed>|null $options
     *
     * @return array<string, mixed>
     *
     * @throws InvalidInputException
     */
    private function settings(string $action, FieldKind $kind, array $current, ?array $options, ?string $unit, ?int $decimals, bool $creating, ?CollectionField $field = null): array
    {
        if (FieldKind::Number === $kind) {
            $unit = trim($unit ?? (\is_string($current['unit'] ?? null) ? $current['unit'] : ''));
            $decimals ??= \is_int($current['decimals'] ?? null) ? $current['decimals'] : 0;

            if (mb_strlen($unit) > 20) {
                throw new InvalidInputException($action, ['/unit' => new Message('must be at most {count} characters, e.g. "m²".', ['count' => 20])]);
            }

            if ($decimals < 0 || $decimals > 6) {
                throw new InvalidInputException($action, ['/decimals' => 'must be from 0 to 6.']);
            }

            return [...('' === $unit ? [] : ['unit' => $unit]), 'decimals' => $decimals];
        }

        if (FieldKind::Choice === $kind) {
            $known = $field?->options() ?? [];

            if (null === $options) {
                if ($creating) {
                    throw new InvalidInputException($action, ['/options' => new Message('is missing: the options by language, one per line, e.g. {"{language}": ["Arabica", "Robusta"]}.', ['language' => $this->languages->default()->code])]);
                }

                return ['options' => $known];
            }

            return ['options' => $this->options($action, $options, $known)];
        }

        // Other kinds have no settings; a form may still send empty ones.
        return [];
    }

    /**
     * The options of a choice after the lines by language. The lines of
     * the default language make the options: the same text keeps its
     * key, with as many lines as before a changed line is renamed. The
     * other languages give the texts by position.
     *
     * @param array<mixed>                                                $input
     * @param list<array{key: string, labels: array<string, string>}> $known
     *
     * @return list<array{key: string, labels: array<string, string>}>
     *
     * @throws InvalidInputException
     */
    private function options(string $action, array $input, array $known): array
    {
        $default = $this->languages->default()->code;
        $lines = [];

        foreach ($input as $language => $texts) {
            $language = (string) $language;
            $at = '/options/' . $language;

            if (!$this->languages->has($language)) {
                throw new InvalidInputException($action, [$at => new Message('There is no language "{language}". Languages: {languages}.', ['language' => $language, 'languages' => implode(', ', $this->languages->codes())])]);
            }

            if (!\is_array($texts) || !array_is_list($texts)) {
                throw new InvalidInputException($action, [$at => 'must be a list of texts, e.g. ["Arabica", "Robusta"].']);
            }

            $lines[$language] = [];

            foreach ($texts as $index => $text) {
                if (!\is_string($text) || mb_strlen(trim($text)) > self::OPTION_LENGTH) {
                    throw new InvalidInputException($action, [$at . '/' . $index => new Message('must be a text of at most {count} characters.', ['count' => self::OPTION_LENGTH])]);
                }

                if ('' !== trim($text) && ($language !== $default || !\in_array(trim($text), $lines[$language], true))) {
                    $lines[$language][] = trim($text);
                }
            }
        }

        $options = $known;

        if (isset($lines[$default])) {
            if ([] === $lines[$default] || \count($lines[$default]) > self::MAX_OPTIONS) {
                throw new InvalidInputException($action, ['/options/' . $default => new Message('needs from 1 to {count} options.', ['count' => self::MAX_OPTIONS])]);
            }

            $options = $this->rename($lines[$default], $known, $default);
        }

        foreach ($lines as $language => $texts) {
            if ($language === $default) {
                continue;
            }

            if (\count($texts) > \count($options)) {
                throw new InvalidInputException($action, ['/options/' . $language => new Message('has more lines than the options in {language}.', ['language' => $this->languages->default()->title])]);
            }

            foreach ($options as $index => $option) {
                if (isset($texts[$index])) {
                    $options[$index]['labels'][$language] = $texts[$index];
                } else {
                    unset($options[$index]['labels'][$language]);
                }
            }
        }

        return $options;
    }

    /**
     * @param list<string>                                                $lines
     * @param list<array{key: string, labels: array<string, string>}> $known
     *
     * @return list<array{key: string, labels: array<string, string>}>
     */
    private function rename(array $lines, array $known, string $default): array
    {
        $byText = [];

        foreach ($known as $option) {
            $byText[$option['labels'][$default] ?? ''] ??= $option;
        }

        $kept = [];
        $options = [];

        foreach ($lines as $index => $line) {
            $option = $byText[$line] ?? null;
            $options[$index] = null === $option ? null : ['key' => $option['key'], 'labels' => $option['labels']];

            if (null !== $option) {
                $kept[$option['key']] = true;
            }
        }

        $same = \count($lines) === \count($known);
        $result = [];

        foreach ($lines as $index => $line) {
            $option = $options[$index];

            if (null === $option && $same && !isset($kept[$known[$index]['key']])) {
                // The same number of lines: a changed line is the option renamed.
                $option = $known[$index];
                $kept[$option['key']] = true;
            }

            if (null === $option) {
                $option = ['key' => self::key($line, $default, $kept), 'labels' => []];
                $kept[$option['key']] = true;
            }

            $option['labels'][$default] = $line;
            $result[] = $option;
        }

        return $result;
    }

    /**
     * @param array<string, true> $taken
     */
    private static function key(string $text, string $language, array $taken): string
    {
        $key = substr(Slug::fromTitle($text, $language), 0, 40);
        $key = 1 === preg_match('/' . ChoiceType::KEY . '/', $key) ? rtrim($key, '-') : 'option';
        $unique = $key;

        for ($number = 2; isset($taken[$unique]); ++$number) {
            $unique = $key . '-' . $number;
        }

        return $unique;
    }
}
