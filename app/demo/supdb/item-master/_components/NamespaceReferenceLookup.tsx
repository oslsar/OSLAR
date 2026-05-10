"use client";

import React from "react";

type NamespaceRow = {
  uid: string;
  code: string | null;
  name: string | null;
};

type ReferenceSetRow = {
  uid: string;
  namespace_uid: string | null;
  code: string | null;
  version: string | null;
  title: string | null;
};

export default function NamespaceReferenceLookup({
  namespaces,
  referenceSets,
  defaultNamespaceUid,
  defaultReferenceSetUid,
}: {
  namespaces: NamespaceRow[];
  referenceSets: ReferenceSetRow[];
  defaultNamespaceUid?: string;
  defaultReferenceSetUid?: string;
}) {
  const [namespaceUid, setNamespaceUid] = React.useState<string>(
    defaultNamespaceUid ?? ""
  );
  const [referenceSetUid, setReferenceSetUid] = React.useState<string>(
    defaultReferenceSetUid ?? ""
  );

  const filteredReferenceSets = React.useMemo(() => {
    if (!namespaceUid) return referenceSets;
    return referenceSets.filter((rs) => (rs.namespace_uid ?? "") === namespaceUid);
  }, [namespaceUid, referenceSets]);

  // If namespace changes and selected reference set isn't valid anymore, clear it.
  React.useEffect(() => {
    if (!referenceSetUid) return;

    const ok = filteredReferenceSets.some((rs) => rs.uid === referenceSetUid);
    if (!ok) setReferenceSetUid("");
  }, [filteredReferenceSets, referenceSetUid]);

  return (
    <>
      <label>
        Namespace
        <select
          name="namespace_uid"
          value={namespaceUid}
          onChange={(e) => setNamespaceUid(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        >
          <option value="">-- None --</option>
          {namespaces.map((ns) => (
            <option key={ns.uid} value={ns.uid}>
              {(ns.code ?? "").trim()} — {(ns.name ?? "").trim()}
            </option>
          ))}
        </select>
      </label>

      <label>
        Reference Set
        <select
          name="reference_set_uid"
          value={referenceSetUid}
          onChange={(e) => setReferenceSetUid(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        >
          <option value="">-- None --</option>

          {filteredReferenceSets.map((rs) => (
            <option key={rs.uid} value={rs.uid}>
              {(rs.code ?? "").trim()}
              {rs.version ? ` v${String(rs.version).trim()}` : ""} —{" "}
              {(rs.title ?? "").trim()}
            </option>
          ))}
        </select>

        <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
          {namespaceUid
            ? `Showing ${filteredReferenceSets.length} reference sets for the selected namespace.`
            : `Showing all reference sets (${filteredReferenceSets.length}). Select a namespace to filter.`}
        </div>
      </label>
    </>
  );
}