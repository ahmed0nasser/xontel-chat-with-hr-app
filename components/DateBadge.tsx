import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/utils/theme";

interface DateBadgeProps {
  date: string;
}

export default function DateBadge({ date }: DateBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  text: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
});
