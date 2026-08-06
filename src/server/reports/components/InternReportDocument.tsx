import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { InternReportData } from "../intern-report";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1F2937",
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#0F3A2F",
  },
  subtitle: {
    fontSize: 10,
    color: "#4B5563",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#DCEBE5",
    color: "#0F3A2F",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#164E3F",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#D1D5DB",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  col3: {
    width: "33.33%",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    padding: 6,
  },
  metaLabel: {
    fontSize: 7.5,
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 1,
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  cardTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 8,
    color: "#6B7280",
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 8.5,
    color: "#374151",
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
    bottom: 20,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    color: "#9CA3AF",
    fontSize: 7.5,
  },
});

function formatDate(value?: string) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function InternReportDocument({ data }: { data: InternReportData }) {
  const { internship, achievements, generatedAt } = data;
  const checkIns =
    "mentorCheckIns" in internship.progressHub
      ? internship.progressHub.mentorCheckIns
      : internship.progressHub.checkInHistory;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{internship.intern.displayName}</Text>
            <Text style={styles.subtitle}>
              Internship Progress & Performance Executive Summary
            </Text>
          </View>
          <Text style={styles.badge}>{internship.status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metadata & Governance</Text>
          <View style={styles.grid}>
            <View style={styles.col3}>
              <View style={styles.card}>
                <Text style={styles.metaLabel}>Current Stage</Text>
                <Text style={styles.metaValue}>{internship.currentStage}</Text>
              </View>
            </View>
            <View style={styles.col3}>
              <View style={styles.card}>
                <Text style={styles.metaLabel}>Team Placement</Text>
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
            <View style={styles.col3}>
              <View style={styles.card}>
                <Text style={styles.metaLabel}>Stage Checklist</Text>
                <Text style={styles.metaValue}>
                  {internship.currentStageChecklist.requiredCompletedCount} /{" "}
                  {internship.currentStageChecklist.requiredTotalCount} Required
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements ({achievements.length})</Text>
          {achievements.length ? (
            achievements.slice(0, 8).map((achievement) => (
              <View key={achievement.id} style={styles.listRow}>
                <View style={styles.listColMain}>
                  <Text style={styles.cardTitle}>
                    {achievement.title} ({achievement.category})
                  </Text>
                  {achievement.description ? (
                    <Text style={styles.cardBody}>{achievement.description}</Text>
                  ) : null}
                </View>
                <Text style={styles.listColSide}>{formatDate(achievement.achievedOn)}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: "#6B7280" }}>No achievements recorded.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Mentor Check-In Context</Text>
          {checkIns.length ? (
            (() => {
              const checkIn = checkIns[0];
              return (
                <View style={styles.card}>
                  <Text style={styles.cardSub}>
                    Week Key: {checkIn.weekKey} · Author: {checkIn.createdBy}
                  </Text>
                  {checkIn.progressSummary ? (
                    <View style={{ marginBottom: 4 }}>
                      <Text style={styles.metaLabel}>Progress Summary</Text>
                      <Text style={styles.cardBody}>{checkIn.progressSummary}</Text>
                    </View>
                  ) : null}
                  {checkIn.strengthsObserved ? (
                    <View style={{ marginBottom: 4 }}>
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
              );
            })()
          ) : (
            <Text style={{ color: "#6B7280" }}>No mentor check-ins shared yet.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Intern Reflection</Text>
          {internship.progressHub.reflections.length ? (
            (() => {
              const reflection = internship.progressHub.reflections[0];
              return (
                <View style={styles.card}>
                  <Text style={styles.cardSub}>Week Key: {reflection.weekKey}</Text>
                  {reflection.accomplishments ? (
                    <View style={{ marginBottom: 4 }}>
                      <Text style={styles.metaLabel}>Accomplishments</Text>
                      <Text style={styles.cardBody}>{reflection.accomplishments}</Text>
                    </View>
                  ) : null}
                  {reflection.challenges ? (
                    <View style={{ marginBottom: 4 }}>
                      <Text style={styles.metaLabel}>Challenges</Text>
                      <Text style={styles.cardBody}>{reflection.challenges}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })()
          ) : (
            <Text style={{ color: "#6B7280" }}>No intern reflections submitted yet.</Text>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text>Fluxon Internship Dashboard · Confidential</Text>
          <Text>Generated on {formatDate(generatedAt)}</Text>
        </View>
      </Page>
    </Document>
  );
}
