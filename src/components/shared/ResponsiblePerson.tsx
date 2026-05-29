import { useCallback, useMemo } from "react";
import { UserCog, Plus, X, Phone, Mail, Globe, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Multi-Key-Persons manager.
 *
 * To stay backwards-compatible with every page that already passes a
 * `string` value (responsiblePerson), we serialize the list as JSON inside
 * that same string. Legacy plain-string values are auto-migrated into a
 * single first entry on read.
 */

export type KeyPerson = {
  id: string;
  name: string;
  role: string;
  phones: string[];      // multiple phone numbers
  emails: string[];      // multiple email addresses
  socials: string[];     // social profile URLs / handles
  channels: string[];    // other communication channels (Telegram, WhatsApp, etc.)
};

const blank = (): KeyPerson => ({
  id: crypto.randomUUID(),
  name: "",
  role: "",
  phones: [""],
  emails: [""],
  socials: [""],
  channels: [""],
});

export const parseKeyPersons = (raw: string): KeyPerson[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as KeyPerson[];
  } catch {
    // legacy plain-string name
    if (raw.trim()) return [{ ...blank(), name: raw.trim() }];
  }
  return [];
};

export const serializeKeyPersons = (people: KeyPerson[]): string =>
  people.length ? JSON.stringify(people) : "";

export const summarizeKeyPersons = (raw: string): string => {
  const list = parseKeyPersons(raw);
  if (!list.length) return "";
  const first = list[0]?.name?.trim();
  if (!first) return "";
  return list.length === 1 ? first : `${first} +${list.length - 1}`;
};

const ChannelList = ({
  label,
  icon: Icon,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  values: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
}) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-muted-foreground" />
      <span className="text-[10px] font-display text-muted-foreground tracking-wider">{label}</span>
    </div>
    <div className="space-y-1">
      {values.map((v, idx) => (
        <div key={idx} className="flex gap-1">
          <Input
            value={v}
            onChange={e => {
              const next = values.slice();
              next[idx] = e.target.value;
              onChange(next);
            }}
            placeholder={placeholder}
            className="bg-secondary border-border text-foreground text-xs h-7"
          />
          {values.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== idx))}
              className="p-1 text-destructive hover:bg-destructive/10 rounded shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...values, ""])}
        className="gap-1 text-[10px] h-6 px-2"
      >
        <Plus className="w-3 h-3" />
        Add
      </Button>
    </div>
  </div>
);

const ResponsiblePerson = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const people = useMemo(() => parseKeyPersons(value), [value]);

  const commit = useCallback(
    (next: KeyPerson[]) => onChange(serializeKeyPersons(next)),
    [onChange],
  );

  const updatePerson = useCallback(
    (idx: number, patch: Partial<KeyPerson>) => {
      const next = people.map((p, i) => (i === idx ? { ...p, ...patch } : p));
      commit(next);
    },
    [people, commit],
  );

  const addPerson = () => commit([...people, blank()]);
  const removePerson = (idx: number) => commit(people.filter((_, i) => i !== idx));

  return (
    <div className="bg-secondary/30 rounded-md border border-border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCog className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-display tracking-wider text-primary">
            KEY PERSONS / RESPONSIBLE PARTIES
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPerson}
          className="gap-1 text-[10px] h-7 px-2"
        >
          <Plus className="w-3 h-3" />
          Add Key Person
        </Button>
      </div>

      {people.length === 0 && (
        <p className="text-[10px] text-muted-foreground">
          No key persons added yet. Click "Add Key Person" to register a responsible party with full contact details.
        </p>
      )}

      {people.map((person, i) => (
        <div key={person.id} className="bg-card border border-border rounded-md p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-display text-muted-foreground">Key Person #{i + 1}</span>
            <button
              type="button"
              onClick={() => removePerson(i)}
              className="p-1 text-destructive hover:bg-destructive/10 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              value={person.name}
              onChange={e => updatePerson(i, { name: e.target.value })}
              placeholder="Full name"
              className="bg-secondary border-border text-foreground text-sm h-8"
            />
            <Input
              value={person.role}
              onChange={e => updatePerson(i, { role: e.target.value })}
              placeholder="Role / Title"
              className="bg-secondary border-border text-foreground text-sm h-8"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ChannelList
              label="PHONES"
              icon={Phone}
              values={person.phones.length ? person.phones : [""]}
              placeholder="+20 100 000 0000"
              onChange={next => updatePerson(i, { phones: next })}
            />
            <ChannelList
              label="EMAILS"
              icon={Mail}
              values={person.emails.length ? person.emails : [""]}
              placeholder="name@example.com"
              onChange={next => updatePerson(i, { emails: next })}
            />
            <ChannelList
              label="SOCIAL PROFILES"
              icon={Globe}
              values={person.socials.length ? person.socials : [""]}
              placeholder="LinkedIn / X / Instagram URL"
              onChange={next => updatePerson(i, { socials: next })}
            />
            <ChannelList
              label="OTHER CHANNELS"
              icon={MessageCircle}
              values={person.channels.length ? person.channels : [""]}
              placeholder="WhatsApp / Telegram / Signal"
              onChange={next => updatePerson(i, { channels: next })}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResponsiblePerson;
