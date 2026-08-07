import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { InternReportData } from "../intern-report";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#1F2937",
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: "#164E3F",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  logoBox: {
    width: 22,
    height: 22,
    backgroundColor: "#164E3F",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  logoText: {
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  brandName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#164E3F",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  headerLeft: {
    flexDirection: "column",
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#0F3A2F",
    lineHeight: 1.15,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 9.5,
    color: "#4B5563",
    lineHeight: 1.25,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badgeActive: { backgroundColor: "#DCEBE5", color: "#0F3A2F" },
  badgePaused: { backgroundColor: "#FEF3C7", color: "#92400E" },
  badgeCompleted: { backgroundColor: "#DBEAFE", color: "#1E40AF" },
  badgeCancelled: { backgroundColor: "#FEE2E2", color: "#991B1B" },

  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#164E3F",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.75,
    borderBottomColor: "#D1D5DB",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -3,
  },
  col2: { width: "50%", paddingHorizontal: 3, marginBottom: 6 },
  col3: { width: "33.33%", paddingHorizontal: 3, marginBottom: 6 },
  col4: { width: "25%", paddingHorizontal: 3, marginBottom: 6 },

  card: {
    backgroundColor: "#F9FAFB",
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    padding: 7,
  },
  metaLabel: {
    fontSize: 7,
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 2,
    fontFamily: "Helvetica-Bold",
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },

  signalPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 7.5,
    marginRight: 4,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  signalWarning: { backgroundColor: "#FEF3C7", color: "#92400E" },
  signalCritical: { backgroundColor: "#FEE2E2", color: "#991B1B" },
  signalPositive: { backgroundColor: "#DCEBE5", color: "#0F3A2F" },
  signalNeutral: { backgroundColor: "#F3F4F6", color: "#4B5563" },

  table: {
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: "#374151",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  tableCell: {
    fontSize: 8,
    color: "#374151",
  },

  cardTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#111827",
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 7.5,
    color: "#6B7280",
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 8,
    color: "#374151",
    lineHeight: 1.35,
  },

  listRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 4,
  },
  listColMain: {
    flexGrow: 1,
  },
  listColSide: {
    width: 80,
    textAlign: "right",
    color: "#6B7280",
    fontSize: 8,
  },

  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    color: "#9CA3AF",
    fontSize: 7,
  },
});

function formatDate(value?: string) {
  if (!value) return "Ongoing / None";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function statusBadgeStyle(status: string) {
  switch (status) {
    case "active":
      return [styles.badge, styles.badgeActive];
    case "paused":
      return [styles.badge, styles.badgePaused];
    case "completed":
      return [styles.badge, styles.badgeCompleted];
    case "cancelled":
      return [styles.badge, styles.badgeCancelled];
    default:
      return [styles.badge, styles.badgeActive];
  }
}

function signalStyle(severity: string) {
  switch (severity) {
    case "critical":
      return [styles.signalPill, styles.signalCritical];
    case "warning":
      return [styles.signalPill, styles.signalWarning];
    case "positive":
      return [styles.signalPill, styles.signalPositive];
    default:
      return [styles.signalPill, styles.signalNeutral];
  }
}

export function InternReportDocument({ data }: { data: InternReportData }) {
  const {
    internship,
    placements,
    teammateAssignments,
    statusHistory,
    achievements,
    generatedAt,
  } = data;

  const checkIns =
    "mentorCheckIns" in internship.progressHub
      ? internship.progressHub.mentorCheckIns
      : internship.progressHub.checkInHistory;

  const reflections = internship.progressHub.reflections;

  return (
    <Document title={`${internship.intern.displayName} - Internship Report`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.brandContainer}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>F</Text>
              </View>
              <Text style={styles.brandName}>Fluxon Internships</Text>
            </View>
            <Text style={styles.title}>{internship.intern.displayName}</Text>
            <Text style={styles.subtitle}>
              Internship Executive Performance & Governance Report
            </Text>
          </View>
          <Text style={statusBadgeStyle(internship.status)}>{internship.status}</Text>
        </View>

        {/* Section: Overview Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Key Overview & Metadata</Text>
          <View style={styles.grid}>
            <View style={styles.col3}>
              <View style={styles.card}>
                <Text style={styles.metaLabel}>Intern Email</Text>
                <Text style={styles.metaValue}>{internship.intern.email}</Text>
              </View>
            </View>
            <View style={styles.col3}>
              <View style={styles.card}>
                <Text style={styles.metaLabel}>Current Stage</Text>
                <Text style={styles.metaValue}>{internship.currentStage}</Text>
              </View>
            </View>
            <View style={styles.col3}>
              <View style={styles.card}>
                <Text style={styles.metaLabel}>Current Placement</Text>
                <Text style={styles.metaValue}>
                  {internship.currentPlacement?.teamTitle ?? "Unassigned"}
                </Text>
              </View>
            </View>
            <View style={styles.col3}>
              <View style={styles.card}>
                <Text style={styles.metaLabel}>Assigned Mentors</Text>
                <Text style={styles.metaValue}>
                  {internship.mentorNames.join(", ") || "None"}
                </Text>
              </View>
            </View>
            <View style={styles.col3}>
              <View style={styles.card}>
                <Text style={styles.metaLabel}>Start Date</Text>
                <Text style={styles.metaValue}>{formatDate(internship.startsAt)}</Text>
              </View>
            </View>
            <View style={styles.col3}>
              <View style={styles.card}>
                <Text style={styles.metaLabel}>Expected End Date</Text>
                <Text style={styles.metaValue}>{formatDate(internship.endsAt)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section: Operational Signals */}
        {internship.attentionSignals.length ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>2. Active Attention Signals & Flags</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {internship.attentionSignals.map((signal) => (
                <Text key={signal.key} style={signalStyle(signal.severity)}>
                  • {signal.label}
                  {signal.count ? ` (${signal.count})` : ""}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {/* Section: Current Stage Checklist Details */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>
            3. Stage Checklist Details ({internship.checklist.stageLabel}) —{" "}
            {internship.checklist.requiredCompletedCount}/
            {internship.checklist.requiredTotalCount} Required Completed
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: "55%" }]}>Task Item</Text>
              <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Type</Text>
              <Text style={[styles.tableHeaderCell, { width: "25%", textAlign: "right" }]}>
                Status
              </Text>
            </View>
            {[
              ...internship.checklist.requiredItems,
              ...internship.checklist.recommendedItems,
            ].map((item) => (
              <View key={item.key} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "55%", fontFamily: "Helvetica-Bold" }]}>
                  {item.label}
                </Text>
                <Text style={[styles.tableCell, { width: "20%", textTransform: "capitalize" }]}>
                  {item.type}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    {
                      width: "25%",
                      textAlign: "right",
                      color: item.completed ? "#0F3A2F" : "#9CA3AF",
                      fontFamily: "Helvetica-Bold",
                    },
                  ]}
                >
                  {item.completed ? "✓ Completed" : "Pending"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section: Team Placements & Assignments History */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>4. Placements & Assignments History</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Team / Teammate</Text>
              <Text style={[styles.tableHeaderCell, { width: "25%" }]}>Role / Responsibilities</Text>
              <Text style={[styles.tableHeaderCell, { width: "25%" }]}>Starts</Text>
              <Text style={[styles.tableHeaderCell, { width: "20%", textAlign: "right" }]}>Ends</Text>
            </View>
            {placements.map((p) => (
              <View key={p.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "30%", fontFamily: "Helvetica-Bold" }]}>
                  {p.teamTitle}
                </Text>
                <Text style={[styles.tableCell, { width: "25%" }]}>Team Placement</Text>
                <Text style={[styles.tableCell, { width: "25%" }]}>{formatDate(p.startsAt)}</Text>
                <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>
                  {formatDate(p.endsAt)}
                </Text>
              </View>
            ))}
            {teammateAssignments.map((t) => (
              <View key={t.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "30%" }]}>{t.teammateName}</Text>
                <Text style={[styles.tableCell, { width: "25%" }]}>
                  {t.responsibilities.join(", ") || "Teammate"}
                </Text>
                <Text style={[styles.tableCell, { width: "25%" }]}>{formatDate(t.startsAt)}</Text>
                <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>
                  {formatDate(t.endsAt)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section: Mentor Check-Ins History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Mentor Weekly Check-Ins History</Text>
          {checkIns.length ? (
            checkIns.map((checkIn) => (
              <View key={checkIn.weekKey} style={[styles.card, { marginBottom: 6 }]} wrap={false}>
                <Text style={styles.cardSub}>
                  Week: {checkIn.weekKey} · Author: {checkIn.createdBy} · Updated:{" "}
                  {formatDate(checkIn.updatedAt)}
                </Text>
                {checkIn.progressSummary ? (
                  <View style={{ marginBottom: 3 }}>
                    <Text style={styles.metaLabel}>Progress Summary</Text>
                    <Text style={styles.cardBody}>{checkIn.progressSummary}</Text>
                  </View>
                ) : null}
                {checkIn.strengthsObserved ? (
                  <View style={{ marginBottom: 3 }}>
                    <Text style={styles.metaLabel}>Strengths Observed</Text>
                    <Text style={styles.cardBody}>{checkIn.strengthsObserved}</Text>
                  </View>
                ) : null}
                {checkIn.areasToImprove ? (
                  <View>
                    <Text style={styles.metaLabel}>Areas to Improve</Text>
                    <Text style={styles.cardBody}>{checkIn.areasToImprove}</Text>
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={{ color: "#6B7280" }}>No mentor check-ins shared yet.</Text>
          )}
        </View>

        {/* Section: Intern Reflections History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Intern Weekly Reflections History</Text>
          {reflections.length ? (
            reflections.map((ref) => (
              <View key={ref.weekKey} style={[styles.card, { marginBottom: 6 }]} wrap={false}>
                <Text style={styles.cardSub}>
                  Week: {ref.weekKey} · Submitted: {formatDate(ref.submittedAt)}
                </Text>
                {ref.accomplishments ? (
                  <View style={{ marginBottom: 3 }}>
                    <Text style={styles.metaLabel}>Accomplishments</Text>
                    <Text style={styles.cardBody}>{ref.accomplishments}</Text>
                  </View>
                ) : null}
                {ref.learnings ? (
                  <View style={{ marginBottom: 3 }}>
                    <Text style={styles.metaLabel}>Learnings</Text>
                    <Text style={styles.cardBody}>{ref.learnings}</Text>
                  </View>
                ) : null}
                {ref.challenges ? (
                  <View style={{ marginBottom: 3 }}>
                    <Text style={styles.metaLabel}>Challenges</Text>
                    <Text style={styles.cardBody}>{ref.challenges}</Text>
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={{ color: "#6B7280" }}>No intern reflections submitted yet.</Text>
          )}
        </View>

        {/* Section: Action Items */}
        {internship.progressHub.actionItems.length ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>7. Operational Action Items</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "45%" }]}>Action</Text>
                <Text style={[styles.tableHeaderCell, { width: "25%" }]}>Owner</Text>
                <Text style={[styles.tableHeaderCell, { width: "15%" }]}>Due Date</Text>
                <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "right" }]}>
                  Status
                </Text>
              </View>
              {internship.progressHub.actionItems.map((action) => (
                <View key={action.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: "45%", fontFamily: "Helvetica-Bold" }]}>
                    {action.title}
                  </Text>
                  <Text style={[styles.tableCell, { width: "25%", textTransform: "capitalize" }]}>
                    {action.ownerType}
                  </Text>
                  <Text style={[styles.tableCell, { width: "15%" }]}>{action.dueDate}</Text>
                  <Text
                    style={[
                      styles.tableCell,
                      {
                        width: "15%",
                        textAlign: "right",
                        color: action.status === "completed" ? "#0F3A2F" : action.overdue ? "#991B1B" : "#374151",
                        fontFamily: "Helvetica-Bold",
                      },
                    ]}
                  >
                    {action.status === "completed" ? "Completed" : action.overdue ? "Overdue" : "Open"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Section: Achievements */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>8. Achievements & Milestones ({achievements.length})</Text>
          {achievements.length ? (
            achievements.map((item) => (
              <View key={item.id} style={styles.listRow}>
                <View style={styles.listColMain}>
                  <Text style={styles.cardTitle}>
                    {item.title} ({item.category})
                  </Text>
                  {item.description ? <Text style={styles.cardBody}>{item.description}</Text> : null}
                </View>
                <Text style={styles.listColSide}>{formatDate(item.achievedOn)}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: "#6B7280" }}>No achievements recorded.</Text>
          )}
        </View>

        {/* Section: Status Change History */}
        {statusHistory.length ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>9. Lifecycle Status Audit History</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Transition</Text>
                <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Changed By</Text>
                <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Date</Text>
                <Text style={[styles.tableHeaderCell, { width: "20%", textAlign: "right" }]}>Reason</Text>
              </View>
              {statusHistory.map((s) => (
                <View key={s.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: "30%", fontFamily: "Helvetica-Bold" }]}>
                    {s.previousStatus} → {s.newStatus}
                  </Text>
                  <Text style={[styles.tableCell, { width: "30%" }]}>{s.changedByName}</Text>
                  <Text style={[styles.tableCell, { width: "20%" }]}>{formatDate(s.changedAt)}</Text>
                  <Text style={[styles.tableCell, { width: "20%", textAlign: "right" }]}>
                    {s.reason || "—"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Fluxon Internship Dashboard · Internal Executive Document</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          <Text>Generated {formatDate(generatedAt)}</Text>
        </View>
      </Page>
    </Document>
  );
}
