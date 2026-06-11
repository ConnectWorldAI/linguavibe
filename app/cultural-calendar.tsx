import { useState, useMemo, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList, Modal } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getUpcomingHolidays,
  getAllHolidaysForLanguage,
  getHolidayLessonRecommendation,
  getMonthName,
  type CulturalHoliday,
} from "@/lib/cultural-calendar";

type ViewMode = "upcoming" | "all";

export default function CulturalCalendarScreen() {
  const colors = useColors();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("upcoming");
  const [selectedLanguage, setSelectedLanguage] = useState("es-DO");
  const [expandedHoliday, setExpandedHoliday] = useState<CulturalHoliday | null>(null);

  const languages = [
    { code: "es-DO", label: "🇩🇴 Dominican", flag: "🇩🇴" },
    { code: "es-MX", label: "🇲🇽 Mexican", flag: "🇲🇽" },
    { code: "es-CO", label: "🇨🇴 Colombian", flag: "🇨🇴" },
    { code: "es-VE", label: "🇻🇪 Venezuelan", flag: "🇻🇪" },
    { code: "es-CU", label: "🇨🇺 Cuban", flag: "🇨🇺" },
    { code: "es-CR", label: "🇨🇷 Costa Rican", flag: "🇨🇷" },
    { code: "es-AR", label: "🇦🇷 Argentine", flag: "🇦🇷" },
    { code: "es-PE", label: "🇵🇪 Peruvian", flag: "🇵🇪" },
    { code: "es-CL", label: "🇨🇱 Chilean", flag: "🇨🇱" },
    { code: "es-PR", label: "🇵🇷 Puerto Rican", flag: "🇵🇷" },
    { code: "fr", label: "🇫🇷 French", flag: "🇫🇷" },
    { code: "ja", label: "🇯🇵 Japanese", flag: "🇯🇵" },
    { code: "ko", label: "🇰🇷 Korean", flag: "🇰🇷" },
    { code: "it", label: "🇮🇹 Italian", flag: "🇮🇹" },
    { code: "de", label: "🇩🇪 German", flag: "🇩🇪" },
    { code: "pt", label: "🇧🇷 Portuguese", flag: "🇧🇷" },
    { code: "zh", label: "🇨🇳 Mandarin", flag: "🇨🇳" },
  ];

  const upcomingHolidays = useMemo(
    () => getUpcomingHolidays(selectedLanguage, 60),
    [selectedLanguage]
  );

  const allHolidays = useMemo(
    () => getAllHolidaysForLanguage(selectedLanguage),
    [selectedLanguage]
  );

  const recommendation = useMemo(
    () => getHolidayLessonRecommendation(selectedLanguage),
    [selectedLanguage]
  );

  const holidays = viewMode === "upcoming" ? upcomingHolidays : allHolidays;

  const getDaysUntil = useCallback((item: CulturalHoliday) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    let daysUntil = (item.month - 1) * 30 + item.day - ((currentMonth - 1) * 30 + currentDay);
    if (daysUntil < -item.durationDays) daysUntil += 360;
    return daysUntil;
  }, []);

  const handleStartLesson = (holiday: CulturalHoliday) => {
    const historyContext = (holiday as any).history
      ? `History: ${(holiday as any).history.whyTheyCelebrate || ""}`
      : "";
    const locationContext = (holiday as any).location
      ? `Location: ${(holiday as any).location.city}, ${(holiday as any).location.country}`
      : "";
    const dancesContext = (holiday as any).dances?.length
      ? `Dance: ${(holiday as any).dances[0].name} — ${(holiday as any).dances[0].description?.slice(0, 100)}`
      : "";

    router.push({
      pathname: "/adaptive-lesson",
      params: {
        topic: `${holiday.nativeName} — ${holiday.name}`,
        category: "vocabulary",
        level: "A2",
        language: selectedLanguage,
        culturalHint: `Learn about ${holiday.nativeName}: ${holiday.description}. ${historyContext} ${locationContext} ${dancesContext} Key vocabulary: ${holiday.vocabulary.slice(0, 5).join(", ")}. Traditions: ${holiday.traditions.slice(0, 3).join("; ")}. Foods: ${holiday.foods.slice(0, 4).join(", ")}. Greetings: ${holiday.greetings.join(", ")}`,
      },
    });
  };

  const renderHolidayCard = ({ item }: { item: CulturalHoliday }) => {
    const daysUntil = getDaysUntil(item);
    const isHappening = daysUntil <= 0 && daysUntil >= -item.durationDays;
    const isSoon = daysUntil > 0 && daysUntil <= 7;
    const isThisMonth = daysUntil > 0 && daysUntil <= 30;

    const holidayData = item as any;
    const hasLocation = !!holidayData.location;
    const hasHistory = !!holidayData.history;
    const hasDances = holidayData.dances?.length > 0;
    const hasNewsStyle = !!holidayData.newsStyle;

    return (
      <TouchableOpacity
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
          borderWidth: isHappening ? 2 : 1,
          borderColor: isHappening ? colors.success : isSoon ? colors.warning : colors.border,
        }}
        onPress={() => setExpandedHoliday(item)}
        activeOpacity={0.7}
      >
        {/* News-style headline */}
        {hasNewsStyle && (isHappening || isSoon) && (
          <View style={{
            backgroundColor: isHappening ? colors.success + "20" : colors.warning + "20",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            marginBottom: 10,
          }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: isHappening ? colors.success : colors.warning }}>
              {isHappening ? "HAPPENING NOW" : `IN ${daysUntil} DAY${daysUntil !== 1 ? "S" : ""}`}
            </Text>
            <Text style={{ fontSize: 12, color: colors.foreground, marginTop: 2, lineHeight: 16 }}>
              {holidayData.newsStyle.headline}
            </Text>
          </View>
        )}

        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
              {item.nativeName}
            </Text>
            {item.pronunciation && (
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                ({item.pronunciation})
              </Text>
            )}
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 2 }}>
              {item.name}
            </Text>
          </View>
          <View style={{
            backgroundColor: isHappening ? colors.success : isSoon ? colors.warning : isThisMonth ? colors.primary : colors.surface,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            borderWidth: isHappening || isSoon || isThisMonth ? 0 : 1,
            borderColor: colors.border,
          }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: isHappening || isSoon || isThisMonth ? "#fff" : colors.muted }}>
              {isHappening ? "NOW!" : isSoon ? `${daysUntil}d` : `${getMonthName(item.month).slice(0, 3)} ${item.day}`}
            </Text>
          </View>
        </View>

        {/* Location */}
        {hasLocation && (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
              WHERE:
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 6, flex: 1 }}>
              {holidayData.location.city}, {holidayData.location.region || holidayData.location.country}
            </Text>
          </View>
        )}

        {/* Description */}
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 10, lineHeight: 18 }}>
          {item.description}
        </Text>

        {/* Quick info chips */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {hasDances && (
            <View style={{ backgroundColor: colors.primary + "15", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
                💃 {holidayData.dances[0].name}
              </Text>
            </View>
          )}
          {item.foods.length > 0 && (
            <View style={{ backgroundColor: colors.warning + "15", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, color: colors.warning, fontWeight: "600" }}>
                🍽️ {item.foods[0]}
              </Text>
            </View>
          )}
          {hasHistory && (
            <View style={{ backgroundColor: colors.success + "15", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, color: colors.success, fontWeight: "600" }}>
                📜 Est. {holidayData.history.yearEstablished > 0 ? holidayData.history.yearEstablished : `${Math.abs(holidayData.history.yearEstablished)} BC`}
              </Text>
            </View>
          )}
          <View style={{ backgroundColor: colors.border + "50", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
            <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>
              {item.durationDays} day{item.durationDays > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Vocabulary Preview */}
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.primary, marginBottom: 4, letterSpacing: 0.5 }}>
            KEY VOCABULARY
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {item.vocabulary.slice(0, 4).map((word, i) => (
              <View key={i} style={{
                backgroundColor: colors.background,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: "500" }}>
                  {word}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Greeting */}
        {item.greetings.length > 0 && (
          <View style={{
            backgroundColor: colors.background,
            padding: 10,
            borderRadius: 10,
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
            marginBottom: 10,
          }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, fontStyle: "italic" }}>
              "{item.greetings[0]}"
            </Text>
          </View>
        )}

        {/* Tap to learn more + Start Lesson */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.primary,
              alignItems: "center",
            }}
            onPress={() => setExpandedHoliday(item)}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>
              Full History
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: "center",
            }}
            onPress={() => handleStartLesson(item)}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
              Start Lesson
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!expandedHoliday) return null;
    const h = expandedHoliday as any;
    return (
      <Modal visible={!!expandedHoliday} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            {/* Close button */}
            <TouchableOpacity
              style={{ alignSelf: "flex-end", padding: 8 }}
              onPress={() => setExpandedHoliday(null)}
            >
              <Text style={{ fontSize: 16, color: colors.primary, fontWeight: "600" }}>Close</Text>
            </TouchableOpacity>

            {/* Title */}
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>
              {expandedHoliday.nativeName}
            </Text>
            {expandedHoliday.pronunciation && (
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>
                ({expandedHoliday.pronunciation})
              </Text>
            )}
            <Text style={{ fontSize: 18, color: colors.muted, marginBottom: 16 }}>
              {expandedHoliday.name}
            </Text>

            {/* Location Section */}
            {h.location && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 8, letterSpacing: 0.5 }}>
                  📍 WHERE IT HAPPENS
                </Text>
                <View style={{ backgroundColor: colors.surface, padding: 14, borderRadius: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                    {h.location.city}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                    {h.location.region ? `${h.location.region}, ` : ""}{h.location.country}
                  </Text>
                  {h.location.famousVenues && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 4 }}>
                        Famous Venues:
                      </Text>
                      {h.location.famousVenues.map((venue: string, i: number) => (
                        <Text key={i} style={{ fontSize: 12, color: colors.foreground, marginTop: 2, paddingLeft: 8 }}>
                          • {venue}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* History Section — WHY THEY CELEBRATE */}
            {h.history && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 8, letterSpacing: 0.5 }}>
                  📜 WHY THEY CELEBRATE
                </Text>
                <View style={{ backgroundColor: colors.surface, padding: 14, borderRadius: 12 }}>
                  {h.history.whyTheyCelebrate && (
                    <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22, marginBottom: 12, fontWeight: "500" }}>
                      {h.history.whyTheyCelebrate}
                    </Text>
                  )}
                  {h.history.origin && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, marginBottom: 4 }}>ORIGIN</Text>
                      <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
                        {h.history.origin}
                      </Text>
                    </View>
                  )}
                  {h.history.historicalContext && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, marginBottom: 4 }}>HISTORICAL CONTEXT</Text>
                      <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
                        {h.history.historicalContext}
                      </Text>
                    </View>
                  )}
                  {h.history.evolution && (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, marginBottom: 4 }}>HOW IT EVOLVED</Text>
                      <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
                        {h.history.evolution}
                      </Text>
                    </View>
                  )}
                  {h.history.yearEstablished && (
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600", marginTop: 4 }}>
                      Established: {h.history.yearEstablished > 0 ? h.history.yearEstablished : `${Math.abs(h.history.yearEstablished)} BC`}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Dances Section */}
            {h.dances?.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 8, letterSpacing: 0.5 }}>
                  💃 DANCES & MUSIC
                </Text>
                {h.dances.map((dance: any, i: number) => (
                  <View key={i} style={{ backgroundColor: colors.surface, padding: 14, borderRadius: 12, marginBottom: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>
                      {dance.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20, marginBottom: 8 }}>
                      {dance.description}
                    </Text>
                    {dance.music && (
                      <View style={{ marginBottom: 6 }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>Music:</Text>
                        <Text style={{ fontSize: 12, color: colors.foreground, marginTop: 2 }}>{dance.music}</Text>
                      </View>
                    )}
                    {dance.attire && (
                      <View>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>What they wear:</Text>
                        <Text style={{ fontSize: 12, color: colors.foreground, marginTop: 2 }}>{dance.attire}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Traditional Music */}
            {h.music?.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 8, letterSpacing: 0.5 }}>
                  🎵 TRADITIONAL MUSIC
                </Text>
                <View style={{ backgroundColor: colors.surface, padding: 14, borderRadius: 12 }}>
                  {h.music.map((song: string, i: number) => (
                    <Text key={i} style={{ fontSize: 13, color: colors.foreground, marginBottom: 4, paddingLeft: 8 }}>
                      • {song}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Traditional Foods */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 8, letterSpacing: 0.5 }}>
                🍽️ TRADITIONAL FOODS
              </Text>
              <View style={{ backgroundColor: colors.surface, padding: 14, borderRadius: 12 }}>
                {expandedHoliday.foods.map((food, i) => (
                  <Text key={i} style={{ fontSize: 13, color: colors.foreground, marginBottom: 4, paddingLeft: 8 }}>
                    • {food}
                  </Text>
                ))}
              </View>
            </View>

            {/* Traditions */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 8, letterSpacing: 0.5 }}>
                🎊 TRADITIONS & CUSTOMS
              </Text>
              <View style={{ backgroundColor: colors.surface, padding: 14, borderRadius: 12 }}>
                {expandedHoliday.traditions.map((tradition, i) => (
                  <Text key={i} style={{ fontSize: 13, color: colors.foreground, marginBottom: 6, lineHeight: 18, paddingLeft: 8 }}>
                    • {tradition}
                  </Text>
                ))}
              </View>
            </View>

            {/* Vocabulary */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 8, letterSpacing: 0.5 }}>
                📚 VOCABULARY TO LEARN
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {expandedHoliday.vocabulary.map((word, i) => (
                  <View key={i} style={{
                    backgroundColor: colors.surface,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                    <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "500" }}>
                      {word}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Greetings */}
            {expandedHoliday.greetings.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 8, letterSpacing: 0.5 }}>
                  👋 GREETINGS & PHRASES
                </Text>
                <View style={{ backgroundColor: colors.surface, padding: 14, borderRadius: 12 }}>
                  {expandedHoliday.greetings.map((greeting, i) => (
                    <Text key={i} style={{ fontSize: 15, color: colors.foreground, fontWeight: "600", fontStyle: "italic", marginBottom: 6 }}>
                      "{greeting}"
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Start Lesson Button */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                marginTop: 8,
              }}
              onPress={() => {
                setExpandedHoliday(null);
                handleStartLesson(expandedHoliday);
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                Start Cultural Lesson
              </Text>
              <Text style={{ color: "#fff", fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                Learn vocabulary, greetings & traditions
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground }}>
          Cultural Calendar
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
          Festivals, holidays & traditions — learn where, when, and why they celebrate
        </Text>
      </View>

      {/* Language Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
      >
        {languages.map(lang => (
          <TouchableOpacity
            key={lang.code}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: selectedLanguage === lang.code ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: selectedLanguage === lang.code ? colors.primary : colors.border,
            }}
            onPress={() => setSelectedLanguage(lang.code)}
            activeOpacity={0.7}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: "600",
              color: selectedLanguage === lang.code ? "#fff" : colors.foreground,
            }}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* View Mode Toggle */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, paddingVertical: 8, gap: 8 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: viewMode === "upcoming" ? colors.primary : colors.surface,
            alignItems: "center",
          }}
          onPress={() => setViewMode("upcoming")}
          activeOpacity={0.7}
        >
          <Text style={{
            fontWeight: "600",
            fontSize: 13,
            color: viewMode === "upcoming" ? "#fff" : colors.muted,
          }}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: viewMode === "all" ? colors.primary : colors.surface,
            alignItems: "center",
          }}
          onPress={() => setViewMode("all")}
          activeOpacity={0.7}
        >
          <Text style={{
            fontWeight: "600",
            fontSize: 13,
            color: viewMode === "all" ? "#fff" : colors.muted,
          }}>
            All Year
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recommendation Banner */}
      {recommendation && viewMode === "upcoming" && (
        <View style={{
          marginHorizontal: 20,
          marginVertical: 8,
          padding: 14,
          backgroundColor: colors.primary + "15",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.primary + "30",
        }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary, marginBottom: 4 }}>
            RECOMMENDED NOW
          </Text>
          <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 18 }}>
            {recommendation.lessonPrompt}
          </Text>
        </View>
      )}

      {/* Holiday List */}
      <FlatList
        data={holidays}
        renderItem={renderHolidayCard}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Text style={{ fontSize: 16, color: colors.muted, textAlign: "center" }}>
              {viewMode === "upcoming"
                ? "No holidays coming up in the next 60 days for this language.\nSwitch to 'All Year' to see the full calendar."
                : "No holidays found for this language."}
            </Text>
          </View>
        }
      />

      {/* Detail Modal */}
      {renderDetailModal()}
    </ScreenContainer>
  );
}
