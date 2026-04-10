import { mount } from "@vue/test-utils";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import UiSearchField from "@/components/ui/UiSearchField.vue";

describe("UiSearchField", () => {
  it("统一通过 v-model 输出输入值，并支持紧凑尺寸变体", async () => {
    const wrapper = mount(UiSearchField, {
      attrs: {
        "data-testid": "shared-search-input",
      },
      props: {
        modelValue: "",
        inputId: "shared-search-input",
        placeholder: "搜索歌曲、歌单、标签或艺人",
        size: "compact",
      },
      attachTo: document.body,
    });

    expect(wrapper.classes()).toContain("ui-search-field--compact");
    const input = wrapper.get('[data-testid="shared-search-input"]');
    expect(input.attributes("type")).toBe("search");
    expect(input.attributes("placeholder")).toContain("搜索歌曲");

    await input.setValue("深夜氛围");
    expect(wrapper.emitted("update:modelValue")).toEqual([["深夜氛围"]]);

    (wrapper.vm as { focus: () => void }).focus();
    expect(document.activeElement).toBe(input.element);
  });

  it("会移除浏览器原生 search 输入框外观，避免内部再出现一层直角边框", () => {
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/components/ui/UiSearchField.vue", "utf-8");

    expect(source).toContain("appearance: none;");
    expect(source).toContain("-webkit-appearance: none;");
    expect(source).toContain("::-webkit-search-decoration");
  });
});
