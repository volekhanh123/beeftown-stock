using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

public class TXTEditorForm : Form
{
	private class SimComboVD_No
	{
		private string value;

		private string display;

		public string Value
		{
			get
			{
				return value;
			}
			set
			{
				this.value = value;
			}
		}

		public string Display
		{
			get
			{
				return display;
			}
			set
			{
				display = value;
			}
		}
	}

	private string InValue;

	private string InCMD;

	private int ptc_row = -1;

	private int ptc_column = -1;

	private bool ptc_getting;

	private IContainer components;

	private Button cancelButton;

	private Button exeButton;

	private UIDataSet uiDataSet;

	private SplitContainer H1_SplitContainer;

	private SplitContainer H2_SplitContainer;

	private BindingNavigator ptc_BindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private ToolStripSeparator bindingNavigatorSeparator2;

	private ToolStripButton bindingNavigatorDeleteItem;

	private ToolStripButton arrow_up_ToolStripButton;

	private ToolStripButton arrow_down_ToolStripButton;

	private BindingSource ptc_BindingSource;

	private DataGridView ptc_DataGridView;

	private DataGridViewTextBoxColumn iDDataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn cMD1DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn display1DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn cMD2DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn display2DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn cMD3DataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn display3DataGridViewTextBoxColumn;

	private BindingSource fileTask_Content_BindingSource1;

	private BindingSource fileTask_Content_BindingSource2;

	private TextBox Result_TextBox;

	private TableLayoutPanel ptc_TableLayoutPanel;

	private Panel FromToFile_CM_Panel;

	private Panel Table_No_Panel;

	private TextBox FromFile_Table_F1_TextBox;

	private Label MA6_Label;

	private TextBox FromFile_Table_F2_TextBox;

	private Label MA5_Label;

	private TextBox FromFile_Table_F3_TextBox;

	private Label MA4_Label;

	private TextBox FromFile_Table_F4_TextBox;

	private Label MA3_Label;

	private TextBox FromFile_Table_F5_TextBox;

	private Label MA2_Label;

	private TextBox FromFile_Table_F6_TextBox;

	private Label MA1_Label;

	private TextBox FromFile_Table_T1_TextBox;

	private TextBox FromFile_Table_T2_TextBox;

	private TextBox FromFile_Table_T3_TextBox;

	private TextBox FromFile_Table_T4_TextBox;

	private TextBox FromFile_Table_T5_TextBox;

	private TextBox FromFile_Table_T6_TextBox;

	private RadioButton FromFile_Sub_RadioButton;

	private RadioButton FromFile_Table_RadioButton;

	private RadioButton FromFile_Cutdown_RadioButton;

	private RadioButton FromFile_DecimalMode_RadioButton;

	private RadioButton FromFile_Neg_RadioButton;

	private RadioButton FromFile_Div_RadioButton;

	private RadioButton FromFile_Multi_RadioButton;

	private RadioButton FromFile_NULL_RadioButton;

	private RadioButton FromFile_Add_RadioButton;

	private TextBox FromFile_Table_Default_TextBox;

	private TextBox FromFile_Cutdown_TextBox;

	private TextBox FromFile_DecimalMode_TextBox;

	private TextBox FromFile_OP_TextBox;

	private Panel FromFile_R_Panel;

	private RadioButton FromFile_ReadConst_RadioButton;

	private TextBox FromFile_ReadConst_TextBox;

	private RadioButton FromFile_ReadMark_RadioButton;

	private ComboBox FromFile_ReadMark_ComboBox;

	private RadioButton FromFile_ReadTo_SP_RadioButton;

	private RadioButton FromFile_DropCHAR_RadioButton;

	private RadioButton FromFile_ReadBytes_RadioButton;

	private NumericUpDown FromFile_ReadBytes_NumericUpDown;

	private RadioButton FromFile_Keep_RadioButton;

	private RadioButton FromFile_ReadTo_CM_RadioButton;

	private TextBox FromFile_DropCHAR_TextBox;

	private TextBox FromFile_ReadTo_SP_TextBox;

	private ComboBox FromFile_ReadTo_CM_ComboBox;

	private Label MB1_Label;

	private Panel FromFile_W_Panel;

	private RadioButton FromFile_GoOnIf_RadioButton;

	private TextBox FromFile_GoOnIf_TextBox;

	private RadioButton FromFile_JudgeMark_RadioButton;

	private ComboBox FromFile_JudgeMark_ComboBox;

	private RadioButton FromFile_SaveTo_RadioButton;

	private RadioButton FromFile_NoSave_RadioButton;

	private ComboBox FromFile_SaveTo_ComboBox;

	private Panel ToFile_R_Panel;

	private RadioButton ToFile_ReadConst_RadioButton;

	private RadioButton ToFile_ReadMark_RadioButton;

	private RadioButton ToFile_LoadFrom_RadioButton;

	private RadioButton ToFile_Keep_RadioButton;

	private ComboBox ToFile_ReadMark_ComboBox;

	private ComboBox ToFile_LoadFrom_ComboBox;

	private TextBox ToFile_ReadConst_TextBox;

	private Panel ToFile_W_Panel;

	private RadioButton ToFile_JudgeMark_RadioButton;

	private ComboBox ToFile_JudgeMark_ComboBox;

	private RadioButton ToFile_WriteWith_SP_RadioButton;

	private RadioButton ToFile_WriteDirectly_RadioButton;

	private RadioButton ToFile_GoOnIf_RadioButton;

	private RadioButton ToFile_WriteBytes_RadioButton;

	private NumericUpDown ToFile_WriteBytes_NumericUpDown;

	private RadioButton ToFile_WriteWith_CM_RadioButton;

	private TextBox ToFile_GoOnIf_TextBox;

	private TextBox ToFile_WriteWith_SP_TextBox;

	private ComboBox ToFile_WriteWith_CM_ComboBox;

	private Label MB2_Label;

	private RadioButton ToFile_NoSave_RadioButton;

	private ComboBox Code_ComboBox;

	public string SG_String
	{
		get
		{
			return Result_TextBox.Text;
		}
		set
		{
			Result_TextBox.Text = value;
		}
	}

	public TXTEditorForm(string sInValue, string sInCMD)
	{
		InValue = sInValue;
		InCMD = sInCMD;
		InitializeComponent();
	}

	private void TXTEditorForm_Load(object sender, EventArgs e)
	{
		ptc_TableLayoutPanel.AutoScroll = false;
		Text = Program.GetLang("pw_Edit");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		exeButton.Text = Program.GetLang("pw_Save");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		arrow_up_ToolStripButton.Text = Program.GetLang("pw_MoveUp");
		arrow_down_ToolStripButton.Text = Program.GetLang("pw_MoveDown");
		display1DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_ReadFrom");
		display2DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Calculate");
		display3DataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_WriteTo");
		FromFile_Keep_RadioButton.Text = Program.GetLang("pw_KeepDataFromUpperLine");
		FromFile_ReadTo_CM_RadioButton.Text = string.Format(Program.GetLang("pw_ReadUntil_e0"), "");
		FromFile_ReadTo_SP_RadioButton.Text = Program.GetLang("pw_ReadUntilSpecialCHAR");
		FromFile_ReadBytes_RadioButton.Text = Program.GetLang("pw_Read");
		Label mB1_Label = MB1_Label;
		string text = (MB2_Label.Text = Program.GetLang("pw_BYTES"));
		mB1_Label.Text = text;
		FromFile_DropCHAR_RadioButton.Text = string.Format(Program.GetLang("pw_DropUntilNOTCHAR_0"), "");
		FromFile_ReadConst_RadioButton.Text = string.Format(Program.GetLang("pw_ReadConst_e0"), "");
		FromFile_ReadMark_RadioButton.Text = string.Format(Program.GetLang("pw_ReadMark_0"), "");
		FromFile_NULL_RadioButton.Text = Program.GetLang("pw_DoNothing");
		FromFile_Neg_RadioButton.Text = Program.GetLang("pw_Negative");
		FromFile_DecimalMode_RadioButton.Text = string.Format(Program.GetLang("pw_ConvertIntoDecimal_0"), "");
		FromFile_Cutdown_RadioButton.Text = string.Format(Program.GetLang("pw_CutdownStringInto_0"), "");
		FromFile_Table_RadioButton.Text = Program.GetLang("pw_Table_Default");
		FromFile_NoSave_RadioButton.Text = Program.GetLang("pw_DoNothing");
		FromFile_SaveTo_RadioButton.Text = string.Format(Program.GetLang("pw_SaveTo_0"), "");
		RadioButton toFile_GoOnIf_RadioButton = ToFile_GoOnIf_RadioButton;
		string text2 = (FromFile_GoOnIf_RadioButton.Text = string.Format(Program.GetLang("pw_GoOnIfe_e0"), ""));
		toFile_GoOnIf_RadioButton.Text = text2;
		RadioButton toFile_JudgeMark_RadioButton = ToFile_JudgeMark_RadioButton;
		string text4 = (FromFile_JudgeMark_RadioButton.Text = string.Format(Program.GetLang("pw_JudgeMark_0"), ""));
		toFile_JudgeMark_RadioButton.Text = text4;
		ToFile_Keep_RadioButton.Text = Program.GetLang("pw_KeepDataFromLowerLine");
		ToFile_LoadFrom_RadioButton.Text = string.Format(Program.GetLang("pw_LoadFrom_0"), "");
		ToFile_ReadConst_RadioButton.Text = string.Format(Program.GetLang("pw_ReadConst_e0"), "");
		ToFile_ReadMark_RadioButton.Text = string.Format(Program.GetLang("pw_ReadMark_0"), "");
		ToFile_NoSave_RadioButton.Text = Program.GetLang("pw_DoNothing");
		ToFile_WriteDirectly_RadioButton.Text = Program.GetLang("pw_WriteDirectly");
		ToFile_WriteWith_CM_RadioButton.Text = string.Format(Program.GetLang("pw_WriteWith_e0"), "");
		ToFile_WriteWith_SP_RadioButton.Text = Program.GetLang("pw_WriteWithSpecialCHAR");
		ToFile_WriteBytes_RadioButton.Text = Program.GetLang("pw_Write");
		Panel fromToFile_CM_Panel = FromToFile_CM_Panel;
		Panel fromFile_R_Panel = FromFile_R_Panel;
		Panel fromFile_W_Panel = FromFile_W_Panel;
		Panel toFile_R_Panel = ToFile_R_Panel;
		bool flag = (ToFile_W_Panel.Visible = false);
		bool flag3 = (toFile_R_Panel.Visible = flag);
		bool flag5 = (fromFile_W_Panel.Visible = flag3);
		bool visible = (fromFile_R_Panel.Visible = flag5);
		fromToFile_CM_Panel.Visible = visible;
		string[] array = Program.GetLang("pw_PLUIE_SpWords").Split('|');
		SimComboVD_No[] array2 = new SimComboVD_No[array.Length / 2];
		SimComboVD_No[] array3 = new SimComboVD_No[array.Length / 2];
		for (int i = 0; i < array.Length / 2; i++)
		{
			SimComboVD_No simComboVD_No = new SimComboVD_No();
			simComboVD_No.Value = array[i * 2 + 1];
			simComboVD_No.Display = array[i * 2];
			array2[i] = (array3[i] = simComboVD_No);
		}
		ComboBox fromFile_ReadTo_CM_ComboBox = FromFile_ReadTo_CM_ComboBox;
		string valueMember = (ToFile_WriteWith_CM_ComboBox.ValueMember = "Value");
		fromFile_ReadTo_CM_ComboBox.ValueMember = valueMember;
		ComboBox fromFile_ReadTo_CM_ComboBox2 = FromFile_ReadTo_CM_ComboBox;
		string displayMember = (ToFile_WriteWith_CM_ComboBox.DisplayMember = "Display");
		fromFile_ReadTo_CM_ComboBox2.DisplayMember = displayMember;
		FromFile_ReadTo_CM_ComboBox.DataSource = array2;
		ToFile_WriteWith_CM_ComboBox.DataSource = array3;
		array = Program.GetLang("pw_PLUIE_ReadMark").Split('|');
		SimComboVD_No[] array4 = new SimComboVD_No[array.Length / 2];
		SimComboVD_No[] array5 = new SimComboVD_No[array.Length / 2];
		SimComboVD_No[] array6 = new SimComboVD_No[array.Length / 2];
		SimComboVD_No[] array7 = new SimComboVD_No[array.Length / 2];
		for (int j = 0; j < array.Length / 2; j++)
		{
			SimComboVD_No simComboVD_No2 = new SimComboVD_No();
			simComboVD_No2.Value = array[j * 2 + 1];
			simComboVD_No2.Display = array[j * 2];
			array4[j] = (array5[j] = (array6[j] = (array7[j] = simComboVD_No2)));
		}
		ComboBox fromFile_JudgeMark_ComboBox = FromFile_JudgeMark_ComboBox;
		ComboBox toFile_JudgeMark_ComboBox = ToFile_JudgeMark_ComboBox;
		ComboBox fromFile_ReadMark_ComboBox = FromFile_ReadMark_ComboBox;
		string text8 = (ToFile_ReadMark_ComboBox.ValueMember = "Value");
		string text10 = (fromFile_ReadMark_ComboBox.ValueMember = text8);
		string valueMember2 = (toFile_JudgeMark_ComboBox.ValueMember = text10);
		fromFile_JudgeMark_ComboBox.ValueMember = valueMember2;
		ComboBox fromFile_JudgeMark_ComboBox2 = FromFile_JudgeMark_ComboBox;
		ComboBox toFile_JudgeMark_ComboBox2 = ToFile_JudgeMark_ComboBox;
		ComboBox fromFile_ReadMark_ComboBox2 = FromFile_ReadMark_ComboBox;
		string text13 = (ToFile_ReadMark_ComboBox.DisplayMember = "Display");
		string text15 = (fromFile_ReadMark_ComboBox2.DisplayMember = text13);
		string displayMember2 = (toFile_JudgeMark_ComboBox2.DisplayMember = text15);
		fromFile_JudgeMark_ComboBox2.DisplayMember = displayMember2;
		FromFile_JudgeMark_ComboBox.DataSource = array4;
		FromFile_ReadMark_ComboBox.DataSource = array5;
		ToFile_JudgeMark_ComboBox.DataSource = array6;
		ToFile_ReadMark_ComboBox.DataSource = array7;
		string[] array8 = Program.GetLang("pw_PLUIE_Value").Split('|');
		string[] array9 = Program.GetLang("pw_PLUIE_Display").Split('|');
		for (int k = 0; k < Math.Min(array8.Length, array9.Length); k++)
		{
			UIDataSet.FileTask_ContentRow fileTask_ContentRow = uiDataSet.FileTask_Content.NewFileTask_ContentRow();
			fileTask_ContentRow.Command = array8[k];
			fileTask_ContentRow.Display = array9[k];
			uiDataSet.FileTask_Content.AddFileTask_ContentRow(fileTask_ContentRow);
		}
		string[] array10 = Program.GetLang("pw_PLUIE_Code").Split('|');
		string[] array11 = array10;
		foreach (string text18 in array11)
		{
			_ = text18.Length;
		}
		if (!Code_ComboBox.Items.Contains(Settings.Default.configEncoding))
		{
			Code_ComboBox.Items.Add(Settings.Default.configEncoding);
		}
		Code_ComboBox.Text = Settings.Default.configEncoding;
		Format_Segment_In(InValue);
		ptc_setcellvalue();
	}

	private void Format_Segment_In(string Segment)
	{
		string[] array = Segment.Split('\r', '\n');
		string[] array2 = array;
		foreach (string text in array2)
		{
			if (text.Length <= 5)
			{
				continue;
			}
			if (text.Substring(0, 5) == "CODE_")
			{
				string text2 = text.Substring(5);
				if (!Code_ComboBox.Items.Contains(text2))
				{
					Code_ComboBox.Items.Add(text2);
				}
				Code_ComboBox.Text = text2;
			}
			else
			{
				if (text.Length <= 9 || !(text.Substring(0, 9) == "FILE_PLU#"))
				{
					continue;
				}
				string[] array3 = Segment.Split('#');
				uiDataSet.PTC.Clear();
				if (InCMD == "UPL")
				{
					UIDataSet.PTCRow pTCRow = null;
					int num = 2;
					for (int j = 0; j < array3.Length; j++)
					{
						string text3 = "";
						string text4 = "";
						if (array3[j].Length >= 1)
						{
							text3 = array3[j].Substring(0, 1);
						}
						if (array3[j].Length >= 2)
						{
							text4 = array3[j].Substring(0, 2);
						}
						int num2 = -1;
						if (text3 == "@")
						{
							num2 = 0;
						}
						else if (text3 == "S")
						{
							num2 = 2;
						}
						else if (text3.ToLower() == "l")
						{
							num2 = 2;
						}
						else if (text3 == "C")
						{
							num2 = 2;
						}
						else if (text3.ToLower() == "d")
						{
							num2 = 0;
						}
						else
						{
							switch (text3)
							{
							case "*":
								break;
							case "/":
								goto IL_01da;
							case "+":
								goto IL_01f0;
							case "-":
								goto IL_0203;
							default:
								goto IL_0208;
							}
							num2 = 1;
						}
						goto IL_0274;
						IL_0203:
						num2 = 1;
						goto IL_0274;
						IL_01da:
						num2 = 1;
						goto IL_0274;
						IL_01f0:
						num2 = 1;
						goto IL_0274;
						IL_0274:
						if (num2 >= 0 && num2 <= 2)
						{
							if (num2 > num)
							{
								uiDataSet.PTC.AddPTCRow(pTCRow);
								pTCRow = null;
							}
							if (pTCRow == null)
							{
								pTCRow = uiDataSet.PTC.NewPTCRow();
								num = 2;
							}
							switch (num2)
							{
							case 0:
								pTCRow.CMD1 = array3[j];
								pTCRow.Display1 = Segment_GetName(pTCRow.CMD1, GetData: true);
								num = -1;
								break;
							case 1:
								pTCRow.CMD2 = array3[j];
								pTCRow.Display2 = Segment_GetName(pTCRow.CMD2);
								num = 0;
								break;
							case 2:
								pTCRow.CMD3 = array3[j];
								pTCRow.Display3 = Segment_GetName(pTCRow.CMD3);
								num = 1;
								break;
							}
						}
						continue;
						IL_0208:
						if (text3.ToLower() == "f")
						{
							num2 = 1;
						}
						else if (text3 == "T")
						{
							num2 = 1;
						}
						else if (text4.ToLower() == "z{")
						{
							num2 = 0;
						}
						else
						{
							if (!(text4 == "Z}"))
							{
								if (text3 == "_")
								{
									break;
								}
								continue;
							}
							num2 = 2;
						}
						goto IL_0274;
					}
					if (pTCRow != null)
					{
						uiDataSet.PTC.AddPTCRow(pTCRow);
						pTCRow = null;
					}
					continue;
				}
				UIDataSet.PTCRow pTCRow2 = null;
				int num3 = 0;
				for (int k = 0; k < array3.Length; k++)
				{
					string text5 = "";
					string text6 = "";
					if (array3[k].Length >= 1)
					{
						text5 = array3[k].Substring(0, 1);
					}
					if (array3[k].Length >= 2)
					{
						text6 = array3[k].Substring(0, 2);
					}
					int num4 = -1;
					switch (text5)
					{
					case "@":
						num4 = 2;
						goto IL_0501;
					case "S":
						num4 = 0;
						goto IL_0501;
					case "s":
						num4 = 0;
						goto IL_0501;
					default:
						{
							if (text5.ToLower() == "l")
							{
								num4 = 0;
							}
							else if (text5.ToLower() == "c")
							{
								num4 = 0;
							}
							else
							{
								switch (text5)
								{
								case "D":
									break;
								case "*":
									goto IL_0451;
								case "/":
									goto IL_0467;
								case "+":
									goto IL_047d;
								case "-":
									goto IL_0490;
								default:
									goto IL_0495;
								}
								num4 = 2;
							}
							goto IL_0501;
						}
						IL_0501:
						if (num4 >= 0 && num4 <= 2)
						{
							if (num4 < num3)
							{
								uiDataSet.PTC.AddPTCRow(pTCRow2);
								pTCRow2 = null;
							}
							if (pTCRow2 == null)
							{
								pTCRow2 = uiDataSet.PTC.NewPTCRow();
								num3 = 0;
							}
							switch (num4)
							{
							case 0:
								pTCRow2.CMD1 = array3[k];
								pTCRow2.Display1 = Segment_GetName(pTCRow2.CMD1, GetData: true);
								num3 = 1;
								break;
							case 1:
								pTCRow2.CMD2 = array3[k];
								pTCRow2.Display2 = Segment_GetName(pTCRow2.CMD2);
								num3 = 2;
								break;
							case 2:
								pTCRow2.CMD3 = array3[k];
								pTCRow2.Display3 = Segment_GetName(pTCRow2.CMD3);
								num3 = 3;
								break;
							}
						}
						continue;
						IL_0495:
						if (text5.ToLower() == "p")
						{
							num4 = 1;
						}
						else if (text5 == "T")
						{
							num4 = 1;
						}
						else if (text6.ToLower() == "z}")
						{
							num4 = 0;
						}
						else
						{
							if (!(text6 == "Z{"))
							{
								if (!(text5 == "_"))
								{
									continue;
								}
								break;
							}
							num4 = 2;
						}
						goto IL_0501;
						IL_047d:
						num4 = 1;
						goto IL_0501;
						IL_0467:
						num4 = 1;
						goto IL_0501;
						IL_0451:
						num4 = 1;
						goto IL_0501;
						IL_0490:
						num4 = 1;
						goto IL_0501;
					}
					break;
				}
				if (pTCRow2 != null)
				{
					uiDataSet.PTC.AddPTCRow(pTCRow2);
					pTCRow2 = null;
				}
			}
		}
	}

	private string Segment_GetName(string Segment, bool GetData = false)
	{
		try
		{
			string text = "";
			string text2 = "";
			string text3 = "";
			string arg = "";
			if (Segment.Length >= 1)
			{
				text3 = Segment.Substring(1);
				text = Segment.Substring(0, 1);
			}
			if (Segment.Length >= 2)
			{
				arg = Segment.Substring(2);
				text2 = Segment.Substring(0, 2);
			}
			if (InCMD == "UPL")
			{
				if (GetData && Segment == "")
				{
					return Program.GetLang("pw_KeepDataFromLowerLine");
				}
				if (text == "@")
				{
					UIDataSet.FileTask_ContentRow fileTask_ContentRow = uiDataSet.FileTask_Content.FindByCommand(text3);
					if (fileTask_ContentRow == null)
					{
						return string.Format(Program.GetLang("pw_LoadFrom_0"), text3);
					}
					return string.Format(Program.GetLang("pw_LoadFrom_0"), uiDataSet.FileTask_Content.FindByCommand(text3).Display);
				}
				if (text == "S")
				{
					if (text3 == "")
					{
						return string.Format(Program.GetLang("pw_WriteWith_e0"), "TAB");
					}
					return string.Format(Program.GetLang("pw_WriteWith_e0"), text3.Replace("\\x23", "#").Replace("\\\\", "\\"));
				}
				if (text.ToLower() == "l")
				{
					if (text3 == "")
					{
						return string.Format(Program.GetLang("pw_WriteDirectly"));
					}
					return string.Format(Program.GetLang("pw_Write_0_bytes"), text3);
				}
				if (text == "C")
				{
					return string.Format(Program.GetLang("pw_GoOnIfe_e0"), text3);
				}
				if (text.ToLower() == "d")
				{
					return string.Format(Program.GetLang("pw_ReadConst_e0"), text3);
				}
				switch (text)
				{
				case "*":
					return $"/{text3}";
				case "/":
					return $"*{text3}";
				case "+":
					return $"-{text3}";
				case "-":
					if (text3 == "-")
					{
						return Program.GetLang("pw_Negative");
					}
					return $"+{text3}";
				}
				if (text.ToLower() == "f")
				{
					return string.Format(Program.GetLang("pw_ConvertIntoDecimal_0"), text3);
				}
				if (text == "T")
				{
					return string.Format(Program.GetLang("pw_TableConvertTo_0"), text3);
				}
				if (text2.ToLower() == "z{")
				{
					return string.Format(Program.GetLang("pw_ReadMark_0"), arg);
				}
				if (text2 == "Z}")
				{
					return string.Format(Program.GetLang("pw_JudgeMark_0"), arg);
				}
			}
			else
			{
				if (GetData && Segment == "")
				{
					return Program.GetLang("pw_KeepDataFromUpperLine");
				}
				switch (text)
				{
				case "@":
				{
					UIDataSet.FileTask_ContentRow fileTask_ContentRow2 = uiDataSet.FileTask_Content.FindByCommand(text3);
					if (fileTask_ContentRow2 == null)
					{
						return string.Format(Program.GetLang("pw_SaveTo_0"), text3);
					}
					return string.Format(Program.GetLang("pw_SaveTo_0"), uiDataSet.FileTask_Content.FindByCommand(text3).Display);
				}
				case "S":
					if (text3 == "")
					{
						return string.Format(Program.GetLang("pw_ReadUntil_e0"), "TAB");
					}
					return string.Format(Program.GetLang("pw_ReadUntil_e0"), text3.Replace("\\x23", "#").Replace("\\\\", "\\"));
				case "s":
					if (text3 == "")
					{
						return string.Format(Program.GetLang("pw_DropUntilNOTCHAR_0"), "TAB");
					}
					return string.Format(Program.GetLang("pw_DropUntilNOTCHAR_0"), text3.Replace("\\x23", "#").Replace("\\\\", "\\"));
				}
				if (text.ToLower() == "l")
				{
					return string.Format(Program.GetLang("pw_Read_0_bytes"), text3);
				}
				if (text.ToLower() == "c")
				{
					return string.Format(Program.GetLang("pw_ReadConst_e0"), text3);
				}
				switch (text)
				{
				case "D":
					return string.Format(Program.GetLang("pw_GoOnIfe_e0"), text3);
				case "*":
					return $"*{text3}";
				case "/":
					return $"/{text3}";
				case "+":
					return $"+{text3}";
				case "-":
					if (text3 == "-")
					{
						return Program.GetLang("pw_Negative");
					}
					return $"-{text3}";
				}
				if (text.ToLower() == "p")
				{
					return string.Format(Program.GetLang("pw_CutdownStringInto_0"), text3);
				}
				if (text == "T")
				{
					return string.Format(Program.GetLang("pw_TableConvertTo_0"), text3);
				}
				if (text2.ToLower() == "z}")
				{
					return string.Format(Program.GetLang("pw_ReadMark_0"), arg);
				}
				if (text2 == "Z{")
				{
					return string.Format(Program.GetLang("pw_JudgeMark_0"), arg);
				}
			}
			return Segment;
		}
		catch
		{
			return Segment;
		}
	}

	private void ptc_DataGridView_CurrentCellChanged(object sender, EventArgs e)
	{
		if (ptc_DataGridView.CurrentCell != null && (ptc_DataGridView.CurrentCell.ColumnIndex == 2 || ptc_DataGridView.CurrentCell.ColumnIndex == 4 || ptc_DataGridView.CurrentCell.ColumnIndex == 6))
		{
			ptc_column = ptc_DataGridView.CurrentCell.ColumnIndex;
			ptc_row = ptc_DataGridView.CurrentCell.RowIndex;
			ptc_getcellvalue();
		}
	}

	private void ptc_getcellvalue()
	{
		ptc_getting = true;
		string text = (string)ptc_DataGridView.Rows[ptc_row].Cells[ptc_column - 1].Value;
		try
		{
			string text2 = "";
			string text3 = "";
			string text4 = "";
			string selectedValue = "";
			if (text.Length >= 1)
			{
				text4 = text.Substring(1);
				text2 = text.Substring(0, 1);
			}
			if (text.Length >= 2)
			{
				selectedValue = text.Substring(2);
				text3 = text.Substring(0, 2);
			}
			Panel fromToFile_CM_Panel = FromToFile_CM_Panel;
			Panel fromFile_R_Panel = FromFile_R_Panel;
			Panel fromFile_W_Panel = FromFile_W_Panel;
			Panel toFile_R_Panel = ToFile_R_Panel;
			bool flag = (ToFile_W_Panel.Visible = false);
			bool flag3 = (toFile_R_Panel.Visible = flag);
			bool flag5 = (fromFile_W_Panel.Visible = flag3);
			bool visible = (fromFile_R_Panel.Visible = flag5);
			fromToFile_CM_Panel.Visible = visible;
			if (InCMD == "UPL")
			{
				if (ptc_column == 2)
				{
					ToFile_R_Panel.Visible = true;
					if (text2 == "@")
					{
						UIDataSet.FileTask_ContentRow fileTask_ContentRow = uiDataSet.FileTask_Content.FindByCommand(text4);
						ToFile_LoadFrom_RadioButton.Checked = true;
						ToFile_LoadFrom_ComboBox.SelectedValue = fileTask_ContentRow.Command;
					}
					else if (text2.ToLower() == "d")
					{
						ToFile_ReadConst_RadioButton.Checked = true;
						ToFile_ReadConst_TextBox.Text = text4;
					}
					else if (text3.ToLower() == "z{")
					{
						ToFile_ReadMark_RadioButton.Checked = true;
						ToFile_ReadMark_ComboBox.SelectedValue = selectedValue;
					}
					else
					{
						ToFile_Keep_RadioButton.Checked = true;
						ptc_DataGridView.Rows[ptc_row].Cells[2].Value = Program.GetLang("pw_KeepDataFromLowerLine");
					}
				}
				else if (ptc_column == 4)
				{
					FromToFile_CM_Panel.Visible = true;
					RadioButton fromFile_DecimalMode_RadioButton = FromFile_DecimalMode_RadioButton;
					bool visible2 = (FromFile_DecimalMode_TextBox.Visible = true);
					fromFile_DecimalMode_RadioButton.Visible = visible2;
					RadioButton fromFile_Cutdown_RadioButton = FromFile_Cutdown_RadioButton;
					bool visible3 = (FromFile_Cutdown_TextBox.Visible = false);
					fromFile_Cutdown_RadioButton.Visible = visible3;
					switch (text2)
					{
					case "*":
						FromFile_Div_RadioButton.Checked = true;
						FromFile_OP_TextBox.Text = text4;
						break;
					case "/":
						FromFile_Multi_RadioButton.Checked = true;
						FromFile_OP_TextBox.Text = text4;
						break;
					case "+":
						FromFile_Sub_RadioButton.Checked = true;
						FromFile_OP_TextBox.Text = text4;
						break;
					case "-":
						if (text4 == "-")
						{
							FromFile_Neg_RadioButton.Checked = true;
							break;
						}
						FromFile_Add_RadioButton.Checked = true;
						FromFile_OP_TextBox.Text = text4;
						break;
					default:
						if (text2.ToLower() == "f")
						{
							FromFile_DecimalMode_RadioButton.Checked = true;
							FromFile_DecimalMode_TextBox.Text = text4;
						}
						else if (text2 == "T")
						{
							FromFile_Table_RadioButton.Checked = true;
							string[] array = text4.Split('|');
							if (array.Length >= 2)
							{
								FromFile_Table_T1_TextBox.Text = array[array.Length / 2 * 2 - 2];
								FromFile_Table_F1_TextBox.Text = array[array.Length / 2 * 2 - 1];
							}
							else
							{
								FromFile_Table_T1_TextBox.Text = "";
								FromFile_Table_F1_TextBox.Text = "";
							}
							if (array.Length >= 4)
							{
								FromFile_Table_T2_TextBox.Text = array[array.Length / 2 * 2 - 4];
								FromFile_Table_F2_TextBox.Text = array[array.Length / 2 * 2 - 3];
							}
							else
							{
								FromFile_Table_T2_TextBox.Text = "";
								FromFile_Table_F2_TextBox.Text = "";
							}
							if (array.Length >= 6)
							{
								FromFile_Table_T3_TextBox.Text = array[array.Length / 2 * 2 - 6];
								FromFile_Table_F3_TextBox.Text = array[array.Length / 2 * 2 - 5];
							}
							else
							{
								FromFile_Table_T3_TextBox.Text = "";
								FromFile_Table_F3_TextBox.Text = "";
							}
							if (array.Length >= 8)
							{
								FromFile_Table_T4_TextBox.Text = array[array.Length / 2 * 2 - 8];
								FromFile_Table_F4_TextBox.Text = array[array.Length / 2 * 2 - 7];
							}
							else
							{
								FromFile_Table_T4_TextBox.Text = "";
								FromFile_Table_F4_TextBox.Text = "";
							}
							if (array.Length >= 10)
							{
								FromFile_Table_T5_TextBox.Text = array[array.Length / 2 * 2 - 10];
								FromFile_Table_F5_TextBox.Text = array[array.Length / 2 * 2 - 9];
							}
							else
							{
								FromFile_Table_T5_TextBox.Text = "";
								FromFile_Table_F5_TextBox.Text = "";
							}
							if (array.Length >= 12)
							{
								FromFile_Table_T6_TextBox.Text = array[array.Length / 2 * 2 - 12];
								FromFile_Table_F6_TextBox.Text = array[array.Length / 2 * 2 - 11];
							}
							else
							{
								FromFile_Table_T6_TextBox.Text = "";
								FromFile_Table_F6_TextBox.Text = "";
							}
						}
						else
						{
							FromFile_NULL_RadioButton.Checked = true;
						}
						break;
					}
				}
				else if (ptc_column == 6)
				{
					ToFile_W_Panel.Visible = true;
					if (text2 == "S")
					{
						if (text4 == "")
						{
							text4 = "\t";
						}
						ToFile_WriteWith_CM_ComboBox.SelectedValue = text4;
						if (ToFile_WriteWith_CM_ComboBox.SelectedIndex >= 0)
						{
							ToFile_WriteWith_CM_RadioButton.Checked = true;
						}
						else
						{
							ToFile_WriteWith_SP_RadioButton.Checked = true;
							ToFile_WriteWith_SP_TextBox.Text = text4;
						}
					}
					else if (text2.ToLower() == "l")
					{
						if (text4 == "")
						{
							ToFile_WriteDirectly_RadioButton.Checked = true;
						}
						else
						{
							ToFile_WriteBytes_RadioButton.Checked = true;
							ToFile_WriteBytes_NumericUpDown.Value = Program.ParseInt(text4, 1);
						}
					}
					else if (text2 == "C")
					{
						ToFile_GoOnIf_RadioButton.Checked = true;
						ToFile_GoOnIf_TextBox.Text = text4;
					}
					else if (text3 == "Z}")
					{
						ToFile_JudgeMark_RadioButton.Checked = true;
						ToFile_JudgeMark_ComboBox.SelectedValue = selectedValue;
					}
					else
					{
						ToFile_NoSave_RadioButton.Checked = true;
					}
				}
			}
			else if (ptc_column == 2)
			{
				FromFile_R_Panel.Visible = true;
				if (text2 == "S")
				{
					if (text4 == "")
					{
						text4 = "\t";
					}
					FromFile_ReadTo_CM_ComboBox.SelectedValue = text4;
					if (FromFile_ReadTo_CM_ComboBox.SelectedIndex >= 0)
					{
						FromFile_ReadTo_CM_RadioButton.Checked = true;
					}
					else
					{
						FromFile_ReadTo_SP_RadioButton.Checked = true;
						FromFile_ReadTo_SP_TextBox.Text = text4;
					}
				}
				else if (text2 == "s")
				{
					FromFile_DropCHAR_RadioButton.Checked = true;
					FromFile_DropCHAR_TextBox.Text = text4;
				}
				else if (text2.ToLower() == "l")
				{
					FromFile_ReadBytes_RadioButton.Checked = true;
					FromFile_ReadBytes_NumericUpDown.Value = Program.ParseInt(text4, 1);
				}
				else if (text2.ToLower() == "c")
				{
					FromFile_ReadConst_RadioButton.Checked = true;
					FromFile_ReadConst_TextBox.Text = text4;
				}
				else if (text3.ToLower() == "z}")
				{
					FromFile_ReadMark_RadioButton.Checked = true;
					FromFile_ReadMark_ComboBox.SelectedValue = selectedValue;
				}
				else
				{
					FromFile_Keep_RadioButton.Checked = true;
					ptc_DataGridView.Rows[ptc_row].Cells[2].Value = Program.GetLang("pw_KeepDataFromUpperLine");
				}
			}
			else if (ptc_column == 4)
			{
				FromToFile_CM_Panel.Visible = true;
				RadioButton fromFile_DecimalMode_RadioButton2 = FromFile_DecimalMode_RadioButton;
				bool visible4 = (FromFile_DecimalMode_TextBox.Visible = false);
				fromFile_DecimalMode_RadioButton2.Visible = visible4;
				RadioButton fromFile_Cutdown_RadioButton2 = FromFile_Cutdown_RadioButton;
				bool visible5 = (FromFile_Cutdown_TextBox.Visible = true);
				fromFile_Cutdown_RadioButton2.Visible = visible5;
				switch (text2)
				{
				case "*":
					FromFile_Multi_RadioButton.Checked = true;
					FromFile_OP_TextBox.Text = text4;
					break;
				case "/":
					FromFile_Div_RadioButton.Checked = true;
					FromFile_OP_TextBox.Text = text4;
					break;
				case "+":
					FromFile_Add_RadioButton.Checked = true;
					FromFile_OP_TextBox.Text = text4;
					break;
				case "-":
					if (text4 == "-")
					{
						FromFile_Neg_RadioButton.Checked = true;
						break;
					}
					FromFile_Sub_RadioButton.Checked = true;
					FromFile_OP_TextBox.Text = text4;
					break;
				default:
					if (text2.ToLower() == "p")
					{
						FromFile_Cutdown_RadioButton.Checked = true;
						FromFile_Cutdown_TextBox.Text = text4;
					}
					else if (text2 == "T")
					{
						FromFile_Table_RadioButton.Checked = true;
						string[] array2 = text4.Split('|');
						if (array2.Length >= 2)
						{
							FromFile_Table_F1_TextBox.Text = array2[array2.Length / 2 * 2 - 2];
							FromFile_Table_T1_TextBox.Text = array2[array2.Length / 2 * 2 - 1];
						}
						else
						{
							FromFile_Table_F1_TextBox.Text = "";
							FromFile_Table_T1_TextBox.Text = "";
						}
						if (array2.Length >= 4)
						{
							FromFile_Table_F2_TextBox.Text = array2[array2.Length / 2 * 2 - 4];
							FromFile_Table_T2_TextBox.Text = array2[array2.Length / 2 * 2 - 3];
						}
						else
						{
							FromFile_Table_F2_TextBox.Text = "";
							FromFile_Table_T2_TextBox.Text = "";
						}
						if (array2.Length >= 6)
						{
							FromFile_Table_F3_TextBox.Text = array2[array2.Length / 2 * 2 - 6];
							FromFile_Table_T3_TextBox.Text = array2[array2.Length / 2 * 2 - 5];
						}
						else
						{
							FromFile_Table_F3_TextBox.Text = "";
							FromFile_Table_T3_TextBox.Text = "";
						}
						if (array2.Length >= 8)
						{
							FromFile_Table_F4_TextBox.Text = array2[array2.Length / 2 * 2 - 8];
							FromFile_Table_T4_TextBox.Text = array2[array2.Length / 2 * 2 - 7];
						}
						else
						{
							FromFile_Table_F4_TextBox.Text = "";
							FromFile_Table_T4_TextBox.Text = "";
						}
						if (array2.Length >= 10)
						{
							FromFile_Table_F5_TextBox.Text = array2[array2.Length / 2 * 2 - 10];
							FromFile_Table_T5_TextBox.Text = array2[array2.Length / 2 * 2 - 9];
						}
						else
						{
							FromFile_Table_F5_TextBox.Text = "";
							FromFile_Table_T5_TextBox.Text = "";
						}
						if (array2.Length >= 12)
						{
							FromFile_Table_F6_TextBox.Text = array2[array2.Length / 2 * 2 - 12];
							FromFile_Table_T6_TextBox.Text = array2[array2.Length / 2 * 2 - 11];
						}
						else
						{
							FromFile_Table_F6_TextBox.Text = "";
							FromFile_Table_T6_TextBox.Text = "";
						}
					}
					else
					{
						FromFile_NULL_RadioButton.Checked = true;
					}
					break;
				}
			}
			else if (ptc_column == 6)
			{
				FromFile_W_Panel.Visible = true;
				if (text2 == "@")
				{
					UIDataSet.FileTask_ContentRow fileTask_ContentRow2 = uiDataSet.FileTask_Content.FindByCommand(text4);
					FromFile_SaveTo_RadioButton.Checked = true;
					FromFile_SaveTo_ComboBox.SelectedValue = fileTask_ContentRow2.Command;
				}
				else if (text2 == "D")
				{
					FromFile_GoOnIf_RadioButton.Checked = true;
					FromFile_GoOnIf_TextBox.Text = text4;
				}
				else if (text3 == "Z{")
				{
					FromFile_JudgeMark_RadioButton.Checked = true;
					FromFile_JudgeMark_ComboBox.SelectedValue = selectedValue;
				}
				else
				{
					FromFile_NoSave_RadioButton.Checked = true;
				}
			}
		}
		catch
		{
		}
		ptc_getting = false;
	}

	private void ptc_setcellvalue()
	{
		int[] array = ((!(InCMD == "UPL")) ? new int[3] { 1, 3, 5 } : new int[3] { 5, 3, 1 });
		string text = "FILE_PLU";
		for (int i = 0; i < ptc_DataGridView.Rows.Count; i++)
		{
			for (int j = 0; j < 3; j++)
			{
				string text2 = (string)ptc_DataGridView.Rows[i].Cells[array[j]].Value;
				if (text2.Length > 0)
				{
					text = text + "#" + text2;
				}
			}
		}
		if (Code_ComboBox.Text.ToLower() != Settings.Default.configEncoding.ToLower())
		{
			text = "CODE_" + Code_ComboBox.Text + "\r\n" + text;
		}
		Result_TextBox.Text = text;
	}

	private void ptc_setcellvalue(string cmd)
	{
		if (ptc_row >= 0 && (ptc_column == 2 || ptc_column == 4 || ptc_column == 6) && ptc_DataGridView.Rows.Count > 0)
		{
			ptc_DataGridView.Rows[ptc_row].Cells[ptc_column - 1].Value = cmd;
			ptc_DataGridView.Rows[ptc_row].Cells[ptc_column].Value = Segment_GetName(cmd, ptc_column == 2);
			ptc_setcellvalue();
		}
	}

	private void FromFile_R_Changed(object sender, EventArgs e)
	{
		FromFile_ReadTo_CM_ComboBox.Enabled = FromFile_ReadTo_CM_RadioButton.Checked;
		FromFile_ReadTo_SP_TextBox.Enabled = FromFile_ReadTo_SP_RadioButton.Checked;
		FromFile_ReadBytes_NumericUpDown.Enabled = FromFile_ReadBytes_RadioButton.Checked;
		FromFile_DropCHAR_TextBox.Enabled = FromFile_DropCHAR_RadioButton.Checked;
		FromFile_ReadConst_TextBox.Enabled = FromFile_ReadConst_RadioButton.Checked;
		FromFile_ReadMark_ComboBox.Enabled = FromFile_ReadMark_RadioButton.Checked;
		if (!ptc_getting)
		{
			string cmd = "";
			if (FromFile_ReadTo_CM_RadioButton.Checked)
			{
				cmd = ((!((string)FromFile_ReadTo_CM_ComboBox.SelectedValue == "\t")) ? ("S" + FromFile_ReadTo_CM_ComboBox.SelectedValue) : "S");
			}
			else if (FromFile_ReadTo_SP_RadioButton.Checked)
			{
				cmd = ((!(FromFile_ReadTo_SP_TextBox.Text == "\t")) ? ("S" + FromFile_ReadTo_SP_TextBox.Text.Replace("\\", "\\\\").Replace("#", "\\x23")) : "S");
			}
			else if (FromFile_ReadBytes_RadioButton.Checked)
			{
				cmd = "L" + FromFile_ReadBytes_NumericUpDown.Value;
			}
			else if (FromFile_DropCHAR_RadioButton.Checked)
			{
				cmd = "s" + FromFile_DropCHAR_TextBox.Text.Replace("\\", "\\\\").Replace("#", "\\x23");
			}
			else if (FromFile_ReadConst_RadioButton.Checked)
			{
				cmd = "c" + FromFile_ReadConst_TextBox.Text;
			}
			else if (FromFile_ReadMark_RadioButton.Checked)
			{
				cmd = "z}" + FromFile_ReadMark_ComboBox.SelectedValue;
			}
			ptc_setcellvalue(cmd);
		}
	}

	private void FromFile_W_Changed(object sender, EventArgs e)
	{
		FromFile_SaveTo_ComboBox.Enabled = FromFile_SaveTo_RadioButton.Checked;
		FromFile_GoOnIf_TextBox.Enabled = FromFile_GoOnIf_RadioButton.Checked;
		FromFile_JudgeMark_ComboBox.Enabled = FromFile_JudgeMark_RadioButton.Checked;
		if (!ptc_getting)
		{
			string cmd = "";
			if (FromFile_SaveTo_RadioButton.Checked)
			{
				cmd = "@" + FromFile_SaveTo_ComboBox.SelectedValue;
			}
			else if (FromFile_GoOnIf_RadioButton.Checked)
			{
				cmd = "D" + FromFile_GoOnIf_TextBox.Text;
			}
			else if (FromFile_JudgeMark_RadioButton.Checked)
			{
				cmd = "Z{" + FromFile_JudgeMark_ComboBox.SelectedValue;
			}
			ptc_setcellvalue(cmd);
		}
	}

	private void FromToFile_CM_Changed(object sender, EventArgs e)
	{
		FromFile_OP_TextBox.Enabled = FromFile_Add_RadioButton.Checked || FromFile_Sub_RadioButton.Checked || FromFile_Multi_RadioButton.Checked || FromFile_Div_RadioButton.Checked;
		FromFile_DecimalMode_TextBox.Enabled = FromFile_DecimalMode_RadioButton.Checked;
		FromFile_Cutdown_TextBox.Enabled = FromFile_Cutdown_RadioButton.Checked;
		Table_No_Panel.Enabled = FromFile_Table_RadioButton.Checked;
		if (Table_No_Panel.Enabled)
		{
			bool flag = true;
			TextBox fromFile_Table_F1_TextBox = FromFile_Table_F1_TextBox;
			bool enabled = (FromFile_Table_T1_TextBox.Enabled = flag);
			fromFile_Table_F1_TextBox.Enabled = enabled;
			flag = flag && FromFile_Table_F1_TextBox.Text.Length + FromFile_Table_T1_TextBox.Text.Length > 0;
			TextBox fromFile_Table_F2_TextBox = FromFile_Table_F2_TextBox;
			bool enabled2 = (FromFile_Table_T2_TextBox.Enabled = flag);
			fromFile_Table_F2_TextBox.Enabled = enabled2;
			flag = flag && FromFile_Table_F2_TextBox.Text.Length + FromFile_Table_T2_TextBox.Text.Length > 0;
			TextBox fromFile_Table_F3_TextBox = FromFile_Table_F3_TextBox;
			bool enabled3 = (FromFile_Table_T3_TextBox.Enabled = flag);
			fromFile_Table_F3_TextBox.Enabled = enabled3;
			flag = flag && FromFile_Table_F3_TextBox.Text.Length + FromFile_Table_T3_TextBox.Text.Length > 0;
			TextBox fromFile_Table_F4_TextBox = FromFile_Table_F4_TextBox;
			bool enabled4 = (FromFile_Table_T4_TextBox.Enabled = flag);
			fromFile_Table_F4_TextBox.Enabled = enabled4;
			flag = flag && FromFile_Table_F4_TextBox.Text.Length + FromFile_Table_T4_TextBox.Text.Length > 0;
			TextBox fromFile_Table_F5_TextBox = FromFile_Table_F5_TextBox;
			bool enabled5 = (FromFile_Table_T5_TextBox.Enabled = flag);
			fromFile_Table_F5_TextBox.Enabled = enabled5;
			flag = flag && FromFile_Table_F5_TextBox.Text.Length + FromFile_Table_T5_TextBox.Text.Length > 0;
			TextBox fromFile_Table_F6_TextBox = FromFile_Table_F6_TextBox;
			bool enabled6 = (FromFile_Table_T6_TextBox.Enabled = flag);
			fromFile_Table_F6_TextBox.Enabled = enabled6;
			flag = flag && FromFile_Table_F6_TextBox.Text.Length + FromFile_Table_T6_TextBox.Text.Length > 0;
			FromFile_Table_Default_TextBox.Text = FromFile_Table_T1_TextBox.Text;
		}
		if (ptc_getting)
		{
			return;
		}
		string cmd = "";
		if (InCMD == "UPL")
		{
			if (FromFile_Add_RadioButton.Checked)
			{
				cmd = "-" + FromFile_OP_TextBox.Text;
			}
			else if (FromFile_Sub_RadioButton.Checked)
			{
				cmd = "+" + FromFile_OP_TextBox.Text;
			}
			else if (FromFile_Multi_RadioButton.Checked)
			{
				cmd = "/" + FromFile_OP_TextBox.Text;
			}
			else if (FromFile_Div_RadioButton.Checked)
			{
				cmd = "*" + FromFile_OP_TextBox.Text;
			}
			else if (FromFile_Neg_RadioButton.Checked)
			{
				cmd = "--";
			}
			else if (FromFile_DecimalMode_RadioButton.Checked)
			{
				cmd = "f" + FromFile_DecimalMode_TextBox.Text;
			}
			else if (FromFile_Table_RadioButton.Checked)
			{
				cmd = FromFile_Table_T1_TextBox.Text + "|" + FromFile_Table_F1_TextBox.Text;
				if (FromFile_Table_T2_TextBox.Text.Length + FromFile_Table_F2_TextBox.Text.Length > 0 && FromFile_Table_T2_TextBox.Enabled)
				{
					cmd = FromFile_Table_T2_TextBox.Text + "|" + FromFile_Table_F2_TextBox.Text + "|" + cmd;
				}
				if (FromFile_Table_T3_TextBox.Text.Length + FromFile_Table_F3_TextBox.Text.Length > 0 && FromFile_Table_T3_TextBox.Enabled)
				{
					cmd = FromFile_Table_T3_TextBox.Text + "|" + FromFile_Table_F3_TextBox.Text + "|" + cmd;
				}
				if (FromFile_Table_T4_TextBox.Text.Length + FromFile_Table_F4_TextBox.Text.Length > 0 && FromFile_Table_T4_TextBox.Enabled)
				{
					cmd = FromFile_Table_T4_TextBox.Text + "|" + FromFile_Table_F4_TextBox.Text + "|" + cmd;
				}
				if (FromFile_Table_T5_TextBox.Text.Length + FromFile_Table_F5_TextBox.Text.Length > 0 && FromFile_Table_T5_TextBox.Enabled)
				{
					cmd = FromFile_Table_T5_TextBox.Text + "|" + FromFile_Table_F5_TextBox.Text + "|" + cmd;
				}
				if (FromFile_Table_T6_TextBox.Text.Length + FromFile_Table_F6_TextBox.Text.Length > 0 && FromFile_Table_T6_TextBox.Enabled)
				{
					cmd = FromFile_Table_T6_TextBox.Text + "|" + FromFile_Table_F6_TextBox.Text + "|" + cmd;
				}
				cmd = "T" + cmd;
			}
		}
		else if (FromFile_Add_RadioButton.Checked)
		{
			cmd = "+" + FromFile_OP_TextBox.Text;
		}
		else if (FromFile_Sub_RadioButton.Checked)
		{
			cmd = "-" + FromFile_OP_TextBox.Text;
		}
		else if (FromFile_Multi_RadioButton.Checked)
		{
			cmd = "*" + FromFile_OP_TextBox.Text;
		}
		else if (FromFile_Div_RadioButton.Checked)
		{
			cmd = "/" + FromFile_OP_TextBox.Text;
		}
		else if (FromFile_Neg_RadioButton.Checked)
		{
			cmd = "--";
		}
		else if (FromFile_Cutdown_RadioButton.Checked)
		{
			cmd = "p" + FromFile_Cutdown_TextBox.Text;
		}
		else if (FromFile_Table_RadioButton.Checked)
		{
			cmd = FromFile_Table_F1_TextBox.Text + "|" + FromFile_Table_T1_TextBox.Text;
			if (FromFile_Table_F2_TextBox.Text.Length + FromFile_Table_T2_TextBox.Text.Length > 0 && FromFile_Table_F2_TextBox.Enabled)
			{
				cmd = FromFile_Table_F2_TextBox.Text + "|" + FromFile_Table_T2_TextBox.Text + "|" + cmd;
			}
			if (FromFile_Table_F3_TextBox.Text.Length + FromFile_Table_T3_TextBox.Text.Length > 0 && FromFile_Table_F3_TextBox.Enabled)
			{
				cmd = FromFile_Table_F3_TextBox.Text + "|" + FromFile_Table_T3_TextBox.Text + "|" + cmd;
			}
			if (FromFile_Table_F4_TextBox.Text.Length + FromFile_Table_T4_TextBox.Text.Length > 0 && FromFile_Table_F4_TextBox.Enabled)
			{
				cmd = FromFile_Table_F4_TextBox.Text + "|" + FromFile_Table_T4_TextBox.Text + "|" + cmd;
			}
			if (FromFile_Table_F5_TextBox.Text.Length + FromFile_Table_T5_TextBox.Text.Length > 0 && FromFile_Table_F5_TextBox.Enabled)
			{
				cmd = FromFile_Table_F5_TextBox.Text + "|" + FromFile_Table_T5_TextBox.Text + "|" + cmd;
			}
			if (FromFile_Table_F6_TextBox.Text.Length + FromFile_Table_T6_TextBox.Text.Length > 0 && FromFile_Table_F6_TextBox.Enabled)
			{
				cmd = FromFile_Table_F6_TextBox.Text + "|" + FromFile_Table_T6_TextBox.Text + "|" + cmd;
			}
			cmd = "T" + cmd;
		}
		ptc_setcellvalue(cmd);
	}

	private void Code_ComboBox_TextChanged(object sender, EventArgs e)
	{
		if (!ptc_getting)
		{
			ptc_setcellvalue();
		}
	}

	private void exchange(int id1, int id2)
	{
		UIDataSet.PTCRow pTCRow = uiDataSet.PTC.FindByID(id1);
		UIDataSet.PTCRow pTCRow2 = uiDataSet.PTC.FindByID(id2);
		if (pTCRow != null && pTCRow2 != null)
		{
			string cMD = pTCRow.CMD1;
			pTCRow.CMD1 = pTCRow2.CMD1;
			pTCRow2.CMD1 = cMD;
			cMD = pTCRow.CMD2;
			pTCRow.CMD2 = pTCRow2.CMD2;
			pTCRow2.CMD2 = cMD;
			cMD = pTCRow.CMD3;
			pTCRow.CMD3 = pTCRow2.CMD3;
			pTCRow2.CMD3 = cMD;
			cMD = pTCRow.Display1;
			pTCRow.Display1 = pTCRow2.Display1;
			pTCRow2.Display1 = cMD;
			cMD = pTCRow.Display2;
			pTCRow.Display2 = pTCRow2.Display2;
			pTCRow2.Display2 = cMD;
			cMD = pTCRow.Display3;
			pTCRow.Display3 = pTCRow2.Display3;
			pTCRow2.Display3 = cMD;
			ptc_BindingSource.EndEdit();
		}
	}

	private void arrow_up_ToolStripButton_Click(object sender, EventArgs e)
	{
		if (ptc_DataGridView.CurrentCell != null && (ptc_DataGridView.CurrentCell.ColumnIndex == 2 || ptc_DataGridView.CurrentCell.ColumnIndex == 4 || ptc_DataGridView.CurrentCell.ColumnIndex == 6) && ptc_DataGridView.CurrentCell.RowIndex > 0)
		{
			int id = (int)ptc_DataGridView.Rows[ptc_DataGridView.CurrentCell.RowIndex].Cells[0].Value;
			int id2 = (int)ptc_DataGridView.Rows[ptc_DataGridView.CurrentCell.RowIndex - 1].Cells[0].Value;
			exchange(id, id2);
			ptc_DataGridView.CurrentCell = ptc_DataGridView.Rows[ptc_DataGridView.CurrentCell.RowIndex - 1].Cells[ptc_DataGridView.CurrentCell.ColumnIndex];
			ptc_setcellvalue();
		}
	}

	private void arrow_down_ToolStripButton_Click(object sender, EventArgs e)
	{
		if (ptc_DataGridView.CurrentCell != null && (ptc_DataGridView.CurrentCell.ColumnIndex == 2 || ptc_DataGridView.CurrentCell.ColumnIndex == 4 || ptc_DataGridView.CurrentCell.ColumnIndex == 6) && ptc_DataGridView.CurrentCell.RowIndex < ptc_DataGridView.Rows.Count - 1)
		{
			int id = (int)ptc_DataGridView.Rows[ptc_DataGridView.CurrentCell.RowIndex].Cells[0].Value;
			int id2 = (int)ptc_DataGridView.Rows[ptc_DataGridView.CurrentCell.RowIndex + 1].Cells[0].Value;
			exchange(id, id2);
			ptc_DataGridView.CurrentCell = ptc_DataGridView.Rows[ptc_DataGridView.CurrentCell.RowIndex + 1].Cells[ptc_DataGridView.CurrentCell.ColumnIndex];
			ptc_setcellvalue();
		}
	}

	private void bindingNavigatorDeleteItem_Click(object sender, EventArgs e)
	{
		ptc_DataGridView.Rows.Remove(ptc_DataGridView.CurrentRow);
		ptc_setcellvalue();
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this.components = new System.ComponentModel.Container();
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.TXTEditorForm));
		this.cancelButton = new System.Windows.Forms.Button();
		this.exeButton = new System.Windows.Forms.Button();
		this.uiDataSet = new ECS.UIDataSet();
		this.H1_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.Code_ComboBox = new System.Windows.Forms.ComboBox();
		this.Result_TextBox = new System.Windows.Forms.TextBox();
		this.H2_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.ptc_DataGridView = new System.Windows.Forms.DataGridView();
		this.iDDataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.cMD1DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.display1DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.cMD2DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.display2DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.cMD3DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.display3DataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.ptc_BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.ptc_BindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.arrow_up_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.arrow_down_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.ptc_TableLayoutPanel = new System.Windows.Forms.TableLayoutPanel();
		this.FromToFile_CM_Panel = new System.Windows.Forms.Panel();
		this.Table_No_Panel = new System.Windows.Forms.Panel();
		this.FromFile_Table_F1_TextBox = new System.Windows.Forms.TextBox();
		this.MA6_Label = new System.Windows.Forms.Label();
		this.FromFile_Table_F2_TextBox = new System.Windows.Forms.TextBox();
		this.MA5_Label = new System.Windows.Forms.Label();
		this.FromFile_Table_F3_TextBox = new System.Windows.Forms.TextBox();
		this.MA4_Label = new System.Windows.Forms.Label();
		this.FromFile_Table_F4_TextBox = new System.Windows.Forms.TextBox();
		this.MA3_Label = new System.Windows.Forms.Label();
		this.FromFile_Table_F5_TextBox = new System.Windows.Forms.TextBox();
		this.MA2_Label = new System.Windows.Forms.Label();
		this.FromFile_Table_F6_TextBox = new System.Windows.Forms.TextBox();
		this.MA1_Label = new System.Windows.Forms.Label();
		this.FromFile_Table_T1_TextBox = new System.Windows.Forms.TextBox();
		this.FromFile_Table_T2_TextBox = new System.Windows.Forms.TextBox();
		this.FromFile_Table_T3_TextBox = new System.Windows.Forms.TextBox();
		this.FromFile_Table_T4_TextBox = new System.Windows.Forms.TextBox();
		this.FromFile_Table_T5_TextBox = new System.Windows.Forms.TextBox();
		this.FromFile_Table_T6_TextBox = new System.Windows.Forms.TextBox();
		this.FromFile_Sub_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_Table_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_Cutdown_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_DecimalMode_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_Neg_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_Div_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_Multi_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_NULL_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_Add_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_Table_Default_TextBox = new System.Windows.Forms.TextBox();
		this.FromFile_Cutdown_TextBox = new System.Windows.Forms.TextBox();
		this.FromFile_DecimalMode_TextBox = new System.Windows.Forms.TextBox();
		this.FromFile_OP_TextBox = new System.Windows.Forms.TextBox();
		this.FromFile_R_Panel = new System.Windows.Forms.Panel();
		this.FromFile_ReadConst_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_ReadConst_TextBox = new System.Windows.Forms.TextBox();
		this.FromFile_ReadMark_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_ReadMark_ComboBox = new System.Windows.Forms.ComboBox();
		this.FromFile_ReadTo_SP_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_DropCHAR_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_ReadBytes_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_ReadBytes_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.FromFile_Keep_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_ReadTo_CM_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_DropCHAR_TextBox = new System.Windows.Forms.TextBox();
		this.FromFile_ReadTo_SP_TextBox = new System.Windows.Forms.TextBox();
		this.FromFile_ReadTo_CM_ComboBox = new System.Windows.Forms.ComboBox();
		this.MB1_Label = new System.Windows.Forms.Label();
		this.FromFile_W_Panel = new System.Windows.Forms.Panel();
		this.FromFile_GoOnIf_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_GoOnIf_TextBox = new System.Windows.Forms.TextBox();
		this.FromFile_JudgeMark_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_JudgeMark_ComboBox = new System.Windows.Forms.ComboBox();
		this.FromFile_SaveTo_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_NoSave_RadioButton = new System.Windows.Forms.RadioButton();
		this.FromFile_SaveTo_ComboBox = new System.Windows.Forms.ComboBox();
		this.fileTask_Content_BindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.ToFile_R_Panel = new System.Windows.Forms.Panel();
		this.ToFile_ReadConst_RadioButton = new System.Windows.Forms.RadioButton();
		this.ToFile_ReadMark_RadioButton = new System.Windows.Forms.RadioButton();
		this.ToFile_LoadFrom_RadioButton = new System.Windows.Forms.RadioButton();
		this.ToFile_Keep_RadioButton = new System.Windows.Forms.RadioButton();
		this.ToFile_ReadMark_ComboBox = new System.Windows.Forms.ComboBox();
		this.ToFile_LoadFrom_ComboBox = new System.Windows.Forms.ComboBox();
		this.fileTask_Content_BindingSource2 = new System.Windows.Forms.BindingSource(this.components);
		this.ToFile_ReadConst_TextBox = new System.Windows.Forms.TextBox();
		this.ToFile_W_Panel = new System.Windows.Forms.Panel();
		this.ToFile_JudgeMark_RadioButton = new System.Windows.Forms.RadioButton();
		this.ToFile_JudgeMark_ComboBox = new System.Windows.Forms.ComboBox();
		this.ToFile_WriteWith_SP_RadioButton = new System.Windows.Forms.RadioButton();
		this.ToFile_WriteDirectly_RadioButton = new System.Windows.Forms.RadioButton();
		this.ToFile_GoOnIf_RadioButton = new System.Windows.Forms.RadioButton();
		this.ToFile_WriteBytes_RadioButton = new System.Windows.Forms.RadioButton();
		this.ToFile_WriteBytes_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.ToFile_WriteWith_CM_RadioButton = new System.Windows.Forms.RadioButton();
		this.ToFile_GoOnIf_TextBox = new System.Windows.Forms.TextBox();
		this.ToFile_WriteWith_SP_TextBox = new System.Windows.Forms.TextBox();
		this.ToFile_WriteWith_CM_ComboBox = new System.Windows.Forms.ComboBox();
		this.MB2_Label = new System.Windows.Forms.Label();
		this.ToFile_NoSave_RadioButton = new System.Windows.Forms.RadioButton();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		this.H1_SplitContainer.Panel1.SuspendLayout();
		this.H1_SplitContainer.Panel2.SuspendLayout();
		this.H1_SplitContainer.SuspendLayout();
		this.H2_SplitContainer.Panel1.SuspendLayout();
		this.H2_SplitContainer.Panel2.SuspendLayout();
		this.H2_SplitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.ptc_DataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ptc_BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ptc_BindingNavigator).BeginInit();
		this.ptc_BindingNavigator.SuspendLayout();
		this.ptc_TableLayoutPanel.SuspendLayout();
		this.FromToFile_CM_Panel.SuspendLayout();
		this.Table_No_Panel.SuspendLayout();
		this.FromFile_R_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.FromFile_ReadBytes_NumericUpDown).BeginInit();
		this.FromFile_W_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.fileTask_Content_BindingSource1).BeginInit();
		this.ToFile_R_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.fileTask_Content_BindingSource2).BeginInit();
		this.ToFile_W_Panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.ToFile_WriteBytes_NumericUpDown).BeginInit();
		base.SuspendLayout();
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		this.exeButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.exeButton, "exeButton");
		this.exeButton.Name = "exeButton";
		this.exeButton.UseVisualStyleBackColor = true;
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.H1_SplitContainer, "H1_SplitContainer");
		this.H1_SplitContainer.Name = "H1_SplitContainer";
		this.H1_SplitContainer.Panel1.Controls.Add(this.Code_ComboBox);
		this.H1_SplitContainer.Panel1.Controls.Add(this.Result_TextBox);
		this.H1_SplitContainer.Panel1.Controls.Add(this.exeButton);
		this.H1_SplitContainer.Panel1.Controls.Add(this.cancelButton);
		this.H1_SplitContainer.Panel2.Controls.Add(this.H2_SplitContainer);
		this.Code_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.Code_ComboBox, "Code_ComboBox");
		this.Code_ComboBox.Name = "Code_ComboBox";
		this.Code_ComboBox.TextChanged += new System.EventHandler(Code_ComboBox_TextChanged);
		this.Result_TextBox.AcceptsReturn = true;
		this.Result_TextBox.AcceptsTab = true;
		resources.ApplyResources(this.Result_TextBox, "Result_TextBox");
		this.Result_TextBox.Name = "Result_TextBox";
		this.Result_TextBox.ReadOnly = true;
		resources.ApplyResources(this.H2_SplitContainer, "H2_SplitContainer");
		this.H2_SplitContainer.Name = "H2_SplitContainer";
		this.H2_SplitContainer.Panel1.Controls.Add(this.ptc_DataGridView);
		this.H2_SplitContainer.Panel1.Controls.Add(this.ptc_BindingNavigator);
		this.H2_SplitContainer.Panel2.Controls.Add(this.ptc_TableLayoutPanel);
		this.ptc_DataGridView.AllowUserToAddRows = false;
		this.ptc_DataGridView.AutoGenerateColumns = false;
		this.ptc_DataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.ptc_DataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.ptc_DataGridView.Columns.AddRange(this.iDDataGridViewTextBoxColumn1, this.cMD1DataGridViewTextBoxColumn, this.display1DataGridViewTextBoxColumn, this.cMD2DataGridViewTextBoxColumn, this.display2DataGridViewTextBoxColumn, this.cMD3DataGridViewTextBoxColumn, this.display3DataGridViewTextBoxColumn);
		this.ptc_DataGridView.DataSource = this.ptc_BindingSource;
		resources.ApplyResources(this.ptc_DataGridView, "ptc_DataGridView");
		this.ptc_DataGridView.Name = "ptc_DataGridView";
		this.ptc_DataGridView.RowTemplate.Height = 23;
		this.ptc_DataGridView.CurrentCellChanged += new System.EventHandler(ptc_DataGridView_CurrentCellChanged);
		this.iDDataGridViewTextBoxColumn1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.iDDataGridViewTextBoxColumn1.DataPropertyName = "ID";
		this.iDDataGridViewTextBoxColumn1.FillWeight = 20f;
		resources.ApplyResources(this.iDDataGridViewTextBoxColumn1, "iDDataGridViewTextBoxColumn1");
		this.iDDataGridViewTextBoxColumn1.Name = "iDDataGridViewTextBoxColumn1";
		this.iDDataGridViewTextBoxColumn1.ReadOnly = true;
		this.iDDataGridViewTextBoxColumn1.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
		this.cMD1DataGridViewTextBoxColumn.DataPropertyName = "CMD1";
		resources.ApplyResources(this.cMD1DataGridViewTextBoxColumn, "cMD1DataGridViewTextBoxColumn");
		this.cMD1DataGridViewTextBoxColumn.Name = "cMD1DataGridViewTextBoxColumn";
		this.cMD1DataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
		this.display1DataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.display1DataGridViewTextBoxColumn.DataPropertyName = "Display1";
		resources.ApplyResources(this.display1DataGridViewTextBoxColumn, "display1DataGridViewTextBoxColumn");
		this.display1DataGridViewTextBoxColumn.Name = "display1DataGridViewTextBoxColumn";
		this.display1DataGridViewTextBoxColumn.ReadOnly = true;
		this.display1DataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
		this.cMD2DataGridViewTextBoxColumn.DataPropertyName = "CMD2";
		resources.ApplyResources(this.cMD2DataGridViewTextBoxColumn, "cMD2DataGridViewTextBoxColumn");
		this.cMD2DataGridViewTextBoxColumn.Name = "cMD2DataGridViewTextBoxColumn";
		this.cMD2DataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
		this.display2DataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.display2DataGridViewTextBoxColumn.DataPropertyName = "Display2";
		resources.ApplyResources(this.display2DataGridViewTextBoxColumn, "display2DataGridViewTextBoxColumn");
		this.display2DataGridViewTextBoxColumn.Name = "display2DataGridViewTextBoxColumn";
		this.display2DataGridViewTextBoxColumn.ReadOnly = true;
		this.display2DataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
		this.cMD3DataGridViewTextBoxColumn.DataPropertyName = "CMD3";
		resources.ApplyResources(this.cMD3DataGridViewTextBoxColumn, "cMD3DataGridViewTextBoxColumn");
		this.cMD3DataGridViewTextBoxColumn.Name = "cMD3DataGridViewTextBoxColumn";
		this.cMD3DataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
		this.display3DataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.display3DataGridViewTextBoxColumn.DataPropertyName = "Display3";
		resources.ApplyResources(this.display3DataGridViewTextBoxColumn, "display3DataGridViewTextBoxColumn");
		this.display3DataGridViewTextBoxColumn.Name = "display3DataGridViewTextBoxColumn";
		this.display3DataGridViewTextBoxColumn.ReadOnly = true;
		this.display3DataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
		this.ptc_BindingSource.DataMember = "PTC";
		this.ptc_BindingSource.DataSource = this.uiDataSet;
		this.ptc_BindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem;
		this.ptc_BindingNavigator.BindingSource = this.ptc_BindingSource;
		this.ptc_BindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.ptc_BindingNavigator.DeleteItem = null;
		this.ptc_BindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[13]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem, this.arrow_up_ToolStripButton, this.arrow_down_ToolStripButton
		});
		resources.ApplyResources(this.ptc_BindingNavigator, "ptc_BindingNavigator");
		this.ptc_BindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.ptc_BindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.ptc_BindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.ptc_BindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.ptc_BindingNavigator.Name = "ptc_BindingNavigator";
		this.ptc_BindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem, "bindingNavigatorMoveFirstItem");
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem, "bindingNavigatorMovePreviousItem");
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		resources.ApplyResources(this.bindingNavigatorSeparator, "bindingNavigatorSeparator");
		resources.ApplyResources(this.bindingNavigatorPositionItem, "bindingNavigatorPositionItem");
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		resources.ApplyResources(this.bindingNavigatorSeparator1, "bindingNavigatorSeparator1");
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem, "bindingNavigatorMoveNextItem");
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem, "bindingNavigatorMoveLastItem");
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		this.bindingNavigatorSeparator2.Name = "bindingNavigatorSeparator2";
		resources.ApplyResources(this.bindingNavigatorSeparator2, "bindingNavigatorSeparator2");
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		this.bindingNavigatorDeleteItem.Click += new System.EventHandler(bindingNavigatorDeleteItem_Click);
		this.arrow_up_ToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.arrow_up_ToolStripButton.Image = ECS.Properties.Resources.ArrowUp;
		resources.ApplyResources(this.arrow_up_ToolStripButton, "arrow_up_ToolStripButton");
		this.arrow_up_ToolStripButton.Name = "arrow_up_ToolStripButton";
		this.arrow_up_ToolStripButton.Click += new System.EventHandler(arrow_up_ToolStripButton_Click);
		this.arrow_down_ToolStripButton.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.arrow_down_ToolStripButton.Image = ECS.Properties.Resources.ArrowDown;
		resources.ApplyResources(this.arrow_down_ToolStripButton, "arrow_down_ToolStripButton");
		this.arrow_down_ToolStripButton.Name = "arrow_down_ToolStripButton";
		this.arrow_down_ToolStripButton.Click += new System.EventHandler(arrow_down_ToolStripButton_Click);
		resources.ApplyResources(this.ptc_TableLayoutPanel, "ptc_TableLayoutPanel");
		this.ptc_TableLayoutPanel.Controls.Add(this.FromToFile_CM_Panel, 0, 1);
		this.ptc_TableLayoutPanel.Controls.Add(this.FromFile_R_Panel, 0, 0);
		this.ptc_TableLayoutPanel.Controls.Add(this.FromFile_W_Panel, 0, 2);
		this.ptc_TableLayoutPanel.Controls.Add(this.ToFile_R_Panel, 0, 3);
		this.ptc_TableLayoutPanel.Controls.Add(this.ToFile_W_Panel, 0, 4);
		this.ptc_TableLayoutPanel.Name = "ptc_TableLayoutPanel";
		this.FromToFile_CM_Panel.Controls.Add(this.Table_No_Panel);
		this.FromToFile_CM_Panel.Controls.Add(this.FromFile_Sub_RadioButton);
		this.FromToFile_CM_Panel.Controls.Add(this.FromFile_Table_RadioButton);
		this.FromToFile_CM_Panel.Controls.Add(this.FromFile_Cutdown_RadioButton);
		this.FromToFile_CM_Panel.Controls.Add(this.FromFile_DecimalMode_RadioButton);
		this.FromToFile_CM_Panel.Controls.Add(this.FromFile_Neg_RadioButton);
		this.FromToFile_CM_Panel.Controls.Add(this.FromFile_Div_RadioButton);
		this.FromToFile_CM_Panel.Controls.Add(this.FromFile_Multi_RadioButton);
		this.FromToFile_CM_Panel.Controls.Add(this.FromFile_NULL_RadioButton);
		this.FromToFile_CM_Panel.Controls.Add(this.FromFile_Add_RadioButton);
		this.FromToFile_CM_Panel.Controls.Add(this.FromFile_Table_Default_TextBox);
		this.FromToFile_CM_Panel.Controls.Add(this.FromFile_Cutdown_TextBox);
		this.FromToFile_CM_Panel.Controls.Add(this.FromFile_DecimalMode_TextBox);
		this.FromToFile_CM_Panel.Controls.Add(this.FromFile_OP_TextBox);
		resources.ApplyResources(this.FromToFile_CM_Panel, "FromToFile_CM_Panel");
		this.FromToFile_CM_Panel.Name = "FromToFile_CM_Panel";
		this.Table_No_Panel.Controls.Add(this.FromFile_Table_F1_TextBox);
		this.Table_No_Panel.Controls.Add(this.MA6_Label);
		this.Table_No_Panel.Controls.Add(this.FromFile_Table_F2_TextBox);
		this.Table_No_Panel.Controls.Add(this.MA5_Label);
		this.Table_No_Panel.Controls.Add(this.FromFile_Table_F3_TextBox);
		this.Table_No_Panel.Controls.Add(this.MA4_Label);
		this.Table_No_Panel.Controls.Add(this.FromFile_Table_F4_TextBox);
		this.Table_No_Panel.Controls.Add(this.MA3_Label);
		this.Table_No_Panel.Controls.Add(this.FromFile_Table_F5_TextBox);
		this.Table_No_Panel.Controls.Add(this.MA2_Label);
		this.Table_No_Panel.Controls.Add(this.FromFile_Table_F6_TextBox);
		this.Table_No_Panel.Controls.Add(this.MA1_Label);
		this.Table_No_Panel.Controls.Add(this.FromFile_Table_T1_TextBox);
		this.Table_No_Panel.Controls.Add(this.FromFile_Table_T2_TextBox);
		this.Table_No_Panel.Controls.Add(this.FromFile_Table_T3_TextBox);
		this.Table_No_Panel.Controls.Add(this.FromFile_Table_T4_TextBox);
		this.Table_No_Panel.Controls.Add(this.FromFile_Table_T5_TextBox);
		this.Table_No_Panel.Controls.Add(this.FromFile_Table_T6_TextBox);
		resources.ApplyResources(this.Table_No_Panel, "Table_No_Panel");
		this.Table_No_Panel.Name = "Table_No_Panel";
		resources.ApplyResources(this.FromFile_Table_F1_TextBox, "FromFile_Table_F1_TextBox");
		this.FromFile_Table_F1_TextBox.Name = "FromFile_Table_F1_TextBox";
		this.FromFile_Table_F1_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.MA6_Label, "MA6_Label");
		this.MA6_Label.Name = "MA6_Label";
		resources.ApplyResources(this.FromFile_Table_F2_TextBox, "FromFile_Table_F2_TextBox");
		this.FromFile_Table_F2_TextBox.Name = "FromFile_Table_F2_TextBox";
		this.FromFile_Table_F2_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.MA5_Label, "MA5_Label");
		this.MA5_Label.Name = "MA5_Label";
		resources.ApplyResources(this.FromFile_Table_F3_TextBox, "FromFile_Table_F3_TextBox");
		this.FromFile_Table_F3_TextBox.Name = "FromFile_Table_F3_TextBox";
		this.FromFile_Table_F3_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.MA4_Label, "MA4_Label");
		this.MA4_Label.Name = "MA4_Label";
		resources.ApplyResources(this.FromFile_Table_F4_TextBox, "FromFile_Table_F4_TextBox");
		this.FromFile_Table_F4_TextBox.Name = "FromFile_Table_F4_TextBox";
		this.FromFile_Table_F4_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.MA3_Label, "MA3_Label");
		this.MA3_Label.Name = "MA3_Label";
		resources.ApplyResources(this.FromFile_Table_F5_TextBox, "FromFile_Table_F5_TextBox");
		this.FromFile_Table_F5_TextBox.Name = "FromFile_Table_F5_TextBox";
		this.FromFile_Table_F5_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.MA2_Label, "MA2_Label");
		this.MA2_Label.Name = "MA2_Label";
		resources.ApplyResources(this.FromFile_Table_F6_TextBox, "FromFile_Table_F6_TextBox");
		this.FromFile_Table_F6_TextBox.Name = "FromFile_Table_F6_TextBox";
		this.FromFile_Table_F6_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.MA1_Label, "MA1_Label");
		this.MA1_Label.Name = "MA1_Label";
		resources.ApplyResources(this.FromFile_Table_T1_TextBox, "FromFile_Table_T1_TextBox");
		this.FromFile_Table_T1_TextBox.Name = "FromFile_Table_T1_TextBox";
		this.FromFile_Table_T1_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_Table_T2_TextBox, "FromFile_Table_T2_TextBox");
		this.FromFile_Table_T2_TextBox.Name = "FromFile_Table_T2_TextBox";
		this.FromFile_Table_T2_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_Table_T3_TextBox, "FromFile_Table_T3_TextBox");
		this.FromFile_Table_T3_TextBox.Name = "FromFile_Table_T3_TextBox";
		this.FromFile_Table_T3_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_Table_T4_TextBox, "FromFile_Table_T4_TextBox");
		this.FromFile_Table_T4_TextBox.Name = "FromFile_Table_T4_TextBox";
		this.FromFile_Table_T4_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_Table_T5_TextBox, "FromFile_Table_T5_TextBox");
		this.FromFile_Table_T5_TextBox.Name = "FromFile_Table_T5_TextBox";
		this.FromFile_Table_T5_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_Table_T6_TextBox, "FromFile_Table_T6_TextBox");
		this.FromFile_Table_T6_TextBox.Name = "FromFile_Table_T6_TextBox";
		this.FromFile_Table_T6_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_Sub_RadioButton, "FromFile_Sub_RadioButton");
		this.FromFile_Sub_RadioButton.Name = "FromFile_Sub_RadioButton";
		this.FromFile_Sub_RadioButton.TabStop = true;
		this.FromFile_Sub_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_Sub_RadioButton.CheckedChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_Table_RadioButton, "FromFile_Table_RadioButton");
		this.FromFile_Table_RadioButton.Name = "FromFile_Table_RadioButton";
		this.FromFile_Table_RadioButton.TabStop = true;
		this.FromFile_Table_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_Table_RadioButton.CheckedChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_Cutdown_RadioButton, "FromFile_Cutdown_RadioButton");
		this.FromFile_Cutdown_RadioButton.Name = "FromFile_Cutdown_RadioButton";
		this.FromFile_Cutdown_RadioButton.TabStop = true;
		this.FromFile_Cutdown_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_Cutdown_RadioButton.CheckedChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_DecimalMode_RadioButton, "FromFile_DecimalMode_RadioButton");
		this.FromFile_DecimalMode_RadioButton.Name = "FromFile_DecimalMode_RadioButton";
		this.FromFile_DecimalMode_RadioButton.TabStop = true;
		this.FromFile_DecimalMode_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_DecimalMode_RadioButton.CheckedChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_Neg_RadioButton, "FromFile_Neg_RadioButton");
		this.FromFile_Neg_RadioButton.Name = "FromFile_Neg_RadioButton";
		this.FromFile_Neg_RadioButton.TabStop = true;
		this.FromFile_Neg_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_Neg_RadioButton.CheckedChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_Div_RadioButton, "FromFile_Div_RadioButton");
		this.FromFile_Div_RadioButton.Name = "FromFile_Div_RadioButton";
		this.FromFile_Div_RadioButton.TabStop = true;
		this.FromFile_Div_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_Div_RadioButton.CheckedChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_Multi_RadioButton, "FromFile_Multi_RadioButton");
		this.FromFile_Multi_RadioButton.Name = "FromFile_Multi_RadioButton";
		this.FromFile_Multi_RadioButton.TabStop = true;
		this.FromFile_Multi_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_Multi_RadioButton.CheckedChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_NULL_RadioButton, "FromFile_NULL_RadioButton");
		this.FromFile_NULL_RadioButton.Name = "FromFile_NULL_RadioButton";
		this.FromFile_NULL_RadioButton.TabStop = true;
		this.FromFile_NULL_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_NULL_RadioButton.CheckedChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_Add_RadioButton, "FromFile_Add_RadioButton");
		this.FromFile_Add_RadioButton.Name = "FromFile_Add_RadioButton";
		this.FromFile_Add_RadioButton.TabStop = true;
		this.FromFile_Add_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_Add_RadioButton.CheckedChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_Table_Default_TextBox, "FromFile_Table_Default_TextBox");
		this.FromFile_Table_Default_TextBox.Name = "FromFile_Table_Default_TextBox";
		this.FromFile_Table_Default_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_Cutdown_TextBox, "FromFile_Cutdown_TextBox");
		this.FromFile_Cutdown_TextBox.Name = "FromFile_Cutdown_TextBox";
		this.FromFile_Cutdown_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_DecimalMode_TextBox, "FromFile_DecimalMode_TextBox");
		this.FromFile_DecimalMode_TextBox.Name = "FromFile_DecimalMode_TextBox";
		this.FromFile_DecimalMode_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		resources.ApplyResources(this.FromFile_OP_TextBox, "FromFile_OP_TextBox");
		this.FromFile_OP_TextBox.Name = "FromFile_OP_TextBox";
		this.FromFile_OP_TextBox.TextChanged += new System.EventHandler(FromToFile_CM_Changed);
		this.FromFile_R_Panel.Controls.Add(this.FromFile_ReadConst_RadioButton);
		this.FromFile_R_Panel.Controls.Add(this.FromFile_ReadConst_TextBox);
		this.FromFile_R_Panel.Controls.Add(this.FromFile_ReadMark_RadioButton);
		this.FromFile_R_Panel.Controls.Add(this.FromFile_ReadMark_ComboBox);
		this.FromFile_R_Panel.Controls.Add(this.FromFile_ReadTo_SP_RadioButton);
		this.FromFile_R_Panel.Controls.Add(this.FromFile_DropCHAR_RadioButton);
		this.FromFile_R_Panel.Controls.Add(this.FromFile_ReadBytes_RadioButton);
		this.FromFile_R_Panel.Controls.Add(this.FromFile_ReadBytes_NumericUpDown);
		this.FromFile_R_Panel.Controls.Add(this.FromFile_Keep_RadioButton);
		this.FromFile_R_Panel.Controls.Add(this.FromFile_ReadTo_CM_RadioButton);
		this.FromFile_R_Panel.Controls.Add(this.FromFile_DropCHAR_TextBox);
		this.FromFile_R_Panel.Controls.Add(this.FromFile_ReadTo_SP_TextBox);
		this.FromFile_R_Panel.Controls.Add(this.FromFile_ReadTo_CM_ComboBox);
		this.FromFile_R_Panel.Controls.Add(this.MB1_Label);
		resources.ApplyResources(this.FromFile_R_Panel, "FromFile_R_Panel");
		this.FromFile_R_Panel.Name = "FromFile_R_Panel";
		resources.ApplyResources(this.FromFile_ReadConst_RadioButton, "FromFile_ReadConst_RadioButton");
		this.FromFile_ReadConst_RadioButton.Name = "FromFile_ReadConst_RadioButton";
		this.FromFile_ReadConst_RadioButton.TabStop = true;
		this.FromFile_ReadConst_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_ReadConst_RadioButton.CheckedChanged += new System.EventHandler(FromFile_R_Changed);
		resources.ApplyResources(this.FromFile_ReadConst_TextBox, "FromFile_ReadConst_TextBox");
		this.FromFile_ReadConst_TextBox.Name = "FromFile_ReadConst_TextBox";
		this.FromFile_ReadConst_TextBox.TextChanged += new System.EventHandler(FromFile_R_Changed);
		resources.ApplyResources(this.FromFile_ReadMark_RadioButton, "FromFile_ReadMark_RadioButton");
		this.FromFile_ReadMark_RadioButton.Name = "FromFile_ReadMark_RadioButton";
		this.FromFile_ReadMark_RadioButton.TabStop = true;
		this.FromFile_ReadMark_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_ReadMark_RadioButton.CheckedChanged += new System.EventHandler(FromFile_R_Changed);
		this.FromFile_ReadMark_ComboBox.DisplayMember = "Display";
		this.FromFile_ReadMark_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.FromFile_ReadMark_ComboBox, "FromFile_ReadMark_ComboBox");
		this.FromFile_ReadMark_ComboBox.Name = "FromFile_ReadMark_ComboBox";
		this.FromFile_ReadMark_ComboBox.ValueMember = "Command";
		this.FromFile_ReadMark_ComboBox.SelectedValueChanged += new System.EventHandler(FromFile_R_Changed);
		resources.ApplyResources(this.FromFile_ReadTo_SP_RadioButton, "FromFile_ReadTo_SP_RadioButton");
		this.FromFile_ReadTo_SP_RadioButton.Name = "FromFile_ReadTo_SP_RadioButton";
		this.FromFile_ReadTo_SP_RadioButton.TabStop = true;
		this.FromFile_ReadTo_SP_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_ReadTo_SP_RadioButton.CheckedChanged += new System.EventHandler(FromFile_R_Changed);
		resources.ApplyResources(this.FromFile_DropCHAR_RadioButton, "FromFile_DropCHAR_RadioButton");
		this.FromFile_DropCHAR_RadioButton.Name = "FromFile_DropCHAR_RadioButton";
		this.FromFile_DropCHAR_RadioButton.TabStop = true;
		this.FromFile_DropCHAR_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_DropCHAR_RadioButton.CheckedChanged += new System.EventHandler(FromFile_R_Changed);
		resources.ApplyResources(this.FromFile_ReadBytes_RadioButton, "FromFile_ReadBytes_RadioButton");
		this.FromFile_ReadBytes_RadioButton.Name = "FromFile_ReadBytes_RadioButton";
		this.FromFile_ReadBytes_RadioButton.TabStop = true;
		this.FromFile_ReadBytes_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_ReadBytes_RadioButton.CheckedChanged += new System.EventHandler(FromFile_R_Changed);
		resources.ApplyResources(this.FromFile_ReadBytes_NumericUpDown, "FromFile_ReadBytes_NumericUpDown");
		this.FromFile_ReadBytes_NumericUpDown.Maximum = new decimal(new int[4] { 999, 0, 0, 0 });
		this.FromFile_ReadBytes_NumericUpDown.Minimum = new decimal(new int[4] { 1, 0, 0, 0 });
		this.FromFile_ReadBytes_NumericUpDown.Name = "FromFile_ReadBytes_NumericUpDown";
		this.FromFile_ReadBytes_NumericUpDown.Value = new decimal(new int[4] { 1, 0, 0, 0 });
		this.FromFile_ReadBytes_NumericUpDown.ValueChanged += new System.EventHandler(FromFile_R_Changed);
		resources.ApplyResources(this.FromFile_Keep_RadioButton, "FromFile_Keep_RadioButton");
		this.FromFile_Keep_RadioButton.Name = "FromFile_Keep_RadioButton";
		this.FromFile_Keep_RadioButton.TabStop = true;
		this.FromFile_Keep_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_Keep_RadioButton.CheckedChanged += new System.EventHandler(FromFile_R_Changed);
		resources.ApplyResources(this.FromFile_ReadTo_CM_RadioButton, "FromFile_ReadTo_CM_RadioButton");
		this.FromFile_ReadTo_CM_RadioButton.Name = "FromFile_ReadTo_CM_RadioButton";
		this.FromFile_ReadTo_CM_RadioButton.TabStop = true;
		this.FromFile_ReadTo_CM_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_ReadTo_CM_RadioButton.CheckedChanged += new System.EventHandler(FromFile_R_Changed);
		resources.ApplyResources(this.FromFile_DropCHAR_TextBox, "FromFile_DropCHAR_TextBox");
		this.FromFile_DropCHAR_TextBox.Name = "FromFile_DropCHAR_TextBox";
		this.FromFile_DropCHAR_TextBox.TextChanged += new System.EventHandler(FromFile_R_Changed);
		resources.ApplyResources(this.FromFile_ReadTo_SP_TextBox, "FromFile_ReadTo_SP_TextBox");
		this.FromFile_ReadTo_SP_TextBox.Name = "FromFile_ReadTo_SP_TextBox";
		this.FromFile_ReadTo_SP_TextBox.TextChanged += new System.EventHandler(FromFile_R_Changed);
		this.FromFile_ReadTo_CM_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.FromFile_ReadTo_CM_ComboBox, "FromFile_ReadTo_CM_ComboBox");
		this.FromFile_ReadTo_CM_ComboBox.Name = "FromFile_ReadTo_CM_ComboBox";
		this.FromFile_ReadTo_CM_ComboBox.SelectedValueChanged += new System.EventHandler(FromFile_R_Changed);
		resources.ApplyResources(this.MB1_Label, "MB1_Label");
		this.MB1_Label.Name = "MB1_Label";
		this.FromFile_W_Panel.Controls.Add(this.FromFile_GoOnIf_RadioButton);
		this.FromFile_W_Panel.Controls.Add(this.FromFile_GoOnIf_TextBox);
		this.FromFile_W_Panel.Controls.Add(this.FromFile_JudgeMark_RadioButton);
		this.FromFile_W_Panel.Controls.Add(this.FromFile_JudgeMark_ComboBox);
		this.FromFile_W_Panel.Controls.Add(this.FromFile_SaveTo_RadioButton);
		this.FromFile_W_Panel.Controls.Add(this.FromFile_NoSave_RadioButton);
		this.FromFile_W_Panel.Controls.Add(this.FromFile_SaveTo_ComboBox);
		resources.ApplyResources(this.FromFile_W_Panel, "FromFile_W_Panel");
		this.FromFile_W_Panel.Name = "FromFile_W_Panel";
		resources.ApplyResources(this.FromFile_GoOnIf_RadioButton, "FromFile_GoOnIf_RadioButton");
		this.FromFile_GoOnIf_RadioButton.Name = "FromFile_GoOnIf_RadioButton";
		this.FromFile_GoOnIf_RadioButton.TabStop = true;
		this.FromFile_GoOnIf_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_GoOnIf_RadioButton.CheckedChanged += new System.EventHandler(FromFile_W_Changed);
		resources.ApplyResources(this.FromFile_GoOnIf_TextBox, "FromFile_GoOnIf_TextBox");
		this.FromFile_GoOnIf_TextBox.Name = "FromFile_GoOnIf_TextBox";
		this.FromFile_GoOnIf_TextBox.TextChanged += new System.EventHandler(FromFile_W_Changed);
		resources.ApplyResources(this.FromFile_JudgeMark_RadioButton, "FromFile_JudgeMark_RadioButton");
		this.FromFile_JudgeMark_RadioButton.Name = "FromFile_JudgeMark_RadioButton";
		this.FromFile_JudgeMark_RadioButton.TabStop = true;
		this.FromFile_JudgeMark_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_JudgeMark_RadioButton.CheckedChanged += new System.EventHandler(FromFile_W_Changed);
		this.FromFile_JudgeMark_ComboBox.DisplayMember = "Display";
		this.FromFile_JudgeMark_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.FromFile_JudgeMark_ComboBox, "FromFile_JudgeMark_ComboBox");
		this.FromFile_JudgeMark_ComboBox.Name = "FromFile_JudgeMark_ComboBox";
		this.FromFile_JudgeMark_ComboBox.ValueMember = "Command";
		this.FromFile_JudgeMark_ComboBox.SelectedValueChanged += new System.EventHandler(FromFile_W_Changed);
		resources.ApplyResources(this.FromFile_SaveTo_RadioButton, "FromFile_SaveTo_RadioButton");
		this.FromFile_SaveTo_RadioButton.Name = "FromFile_SaveTo_RadioButton";
		this.FromFile_SaveTo_RadioButton.TabStop = true;
		this.FromFile_SaveTo_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_SaveTo_RadioButton.CheckedChanged += new System.EventHandler(FromFile_W_Changed);
		resources.ApplyResources(this.FromFile_NoSave_RadioButton, "FromFile_NoSave_RadioButton");
		this.FromFile_NoSave_RadioButton.Name = "FromFile_NoSave_RadioButton";
		this.FromFile_NoSave_RadioButton.TabStop = true;
		this.FromFile_NoSave_RadioButton.UseVisualStyleBackColor = true;
		this.FromFile_NoSave_RadioButton.CheckedChanged += new System.EventHandler(FromFile_W_Changed);
		this.FromFile_SaveTo_ComboBox.DataSource = this.fileTask_Content_BindingSource1;
		this.FromFile_SaveTo_ComboBox.DisplayMember = "Display";
		this.FromFile_SaveTo_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.FromFile_SaveTo_ComboBox, "FromFile_SaveTo_ComboBox");
		this.FromFile_SaveTo_ComboBox.Name = "FromFile_SaveTo_ComboBox";
		this.FromFile_SaveTo_ComboBox.ValueMember = "Command";
		this.FromFile_SaveTo_ComboBox.SelectedValueChanged += new System.EventHandler(FromFile_W_Changed);
		this.fileTask_Content_BindingSource1.DataMember = "FileTask_Content";
		this.fileTask_Content_BindingSource1.DataSource = this.uiDataSet;
		this.ToFile_R_Panel.Controls.Add(this.ToFile_ReadConst_RadioButton);
		this.ToFile_R_Panel.Controls.Add(this.ToFile_ReadMark_RadioButton);
		this.ToFile_R_Panel.Controls.Add(this.ToFile_LoadFrom_RadioButton);
		this.ToFile_R_Panel.Controls.Add(this.ToFile_Keep_RadioButton);
		this.ToFile_R_Panel.Controls.Add(this.ToFile_ReadMark_ComboBox);
		this.ToFile_R_Panel.Controls.Add(this.ToFile_LoadFrom_ComboBox);
		this.ToFile_R_Panel.Controls.Add(this.ToFile_ReadConst_TextBox);
		resources.ApplyResources(this.ToFile_R_Panel, "ToFile_R_Panel");
		this.ToFile_R_Panel.Name = "ToFile_R_Panel";
		resources.ApplyResources(this.ToFile_ReadConst_RadioButton, "ToFile_ReadConst_RadioButton");
		this.ToFile_ReadConst_RadioButton.Name = "ToFile_ReadConst_RadioButton";
		this.ToFile_ReadConst_RadioButton.TabStop = true;
		this.ToFile_ReadConst_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.ToFile_ReadMark_RadioButton, "ToFile_ReadMark_RadioButton");
		this.ToFile_ReadMark_RadioButton.Name = "ToFile_ReadMark_RadioButton";
		this.ToFile_ReadMark_RadioButton.TabStop = true;
		this.ToFile_ReadMark_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.ToFile_LoadFrom_RadioButton, "ToFile_LoadFrom_RadioButton");
		this.ToFile_LoadFrom_RadioButton.Name = "ToFile_LoadFrom_RadioButton";
		this.ToFile_LoadFrom_RadioButton.TabStop = true;
		this.ToFile_LoadFrom_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.ToFile_Keep_RadioButton, "ToFile_Keep_RadioButton");
		this.ToFile_Keep_RadioButton.Name = "ToFile_Keep_RadioButton";
		this.ToFile_Keep_RadioButton.TabStop = true;
		this.ToFile_Keep_RadioButton.UseVisualStyleBackColor = true;
		this.ToFile_ReadMark_ComboBox.DisplayMember = "Display";
		this.ToFile_ReadMark_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.ToFile_ReadMark_ComboBox, "ToFile_ReadMark_ComboBox");
		this.ToFile_ReadMark_ComboBox.Name = "ToFile_ReadMark_ComboBox";
		this.ToFile_ReadMark_ComboBox.ValueMember = "Command";
		this.ToFile_LoadFrom_ComboBox.DataSource = this.fileTask_Content_BindingSource2;
		this.ToFile_LoadFrom_ComboBox.DisplayMember = "Display";
		this.ToFile_LoadFrom_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.ToFile_LoadFrom_ComboBox, "ToFile_LoadFrom_ComboBox");
		this.ToFile_LoadFrom_ComboBox.Name = "ToFile_LoadFrom_ComboBox";
		this.ToFile_LoadFrom_ComboBox.ValueMember = "Command";
		this.fileTask_Content_BindingSource2.DataMember = "FileTask_Content";
		this.fileTask_Content_BindingSource2.DataSource = this.uiDataSet;
		resources.ApplyResources(this.ToFile_ReadConst_TextBox, "ToFile_ReadConst_TextBox");
		this.ToFile_ReadConst_TextBox.Name = "ToFile_ReadConst_TextBox";
		this.ToFile_W_Panel.Controls.Add(this.ToFile_JudgeMark_RadioButton);
		this.ToFile_W_Panel.Controls.Add(this.ToFile_JudgeMark_ComboBox);
		this.ToFile_W_Panel.Controls.Add(this.ToFile_WriteWith_SP_RadioButton);
		this.ToFile_W_Panel.Controls.Add(this.ToFile_WriteDirectly_RadioButton);
		this.ToFile_W_Panel.Controls.Add(this.ToFile_GoOnIf_RadioButton);
		this.ToFile_W_Panel.Controls.Add(this.ToFile_WriteBytes_RadioButton);
		this.ToFile_W_Panel.Controls.Add(this.ToFile_WriteBytes_NumericUpDown);
		this.ToFile_W_Panel.Controls.Add(this.ToFile_WriteWith_CM_RadioButton);
		this.ToFile_W_Panel.Controls.Add(this.ToFile_GoOnIf_TextBox);
		this.ToFile_W_Panel.Controls.Add(this.ToFile_WriteWith_SP_TextBox);
		this.ToFile_W_Panel.Controls.Add(this.ToFile_WriteWith_CM_ComboBox);
		this.ToFile_W_Panel.Controls.Add(this.MB2_Label);
		this.ToFile_W_Panel.Controls.Add(this.ToFile_NoSave_RadioButton);
		resources.ApplyResources(this.ToFile_W_Panel, "ToFile_W_Panel");
		this.ToFile_W_Panel.Name = "ToFile_W_Panel";
		resources.ApplyResources(this.ToFile_JudgeMark_RadioButton, "ToFile_JudgeMark_RadioButton");
		this.ToFile_JudgeMark_RadioButton.Name = "ToFile_JudgeMark_RadioButton";
		this.ToFile_JudgeMark_RadioButton.TabStop = true;
		this.ToFile_JudgeMark_RadioButton.UseVisualStyleBackColor = true;
		this.ToFile_JudgeMark_ComboBox.DisplayMember = "Display";
		this.ToFile_JudgeMark_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.ToFile_JudgeMark_ComboBox, "ToFile_JudgeMark_ComboBox");
		this.ToFile_JudgeMark_ComboBox.Name = "ToFile_JudgeMark_ComboBox";
		this.ToFile_JudgeMark_ComboBox.ValueMember = "Command";
		resources.ApplyResources(this.ToFile_WriteWith_SP_RadioButton, "ToFile_WriteWith_SP_RadioButton");
		this.ToFile_WriteWith_SP_RadioButton.Name = "ToFile_WriteWith_SP_RadioButton";
		this.ToFile_WriteWith_SP_RadioButton.TabStop = true;
		this.ToFile_WriteWith_SP_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.ToFile_WriteDirectly_RadioButton, "ToFile_WriteDirectly_RadioButton");
		this.ToFile_WriteDirectly_RadioButton.Name = "ToFile_WriteDirectly_RadioButton";
		this.ToFile_WriteDirectly_RadioButton.TabStop = true;
		this.ToFile_WriteDirectly_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.ToFile_GoOnIf_RadioButton, "ToFile_GoOnIf_RadioButton");
		this.ToFile_GoOnIf_RadioButton.Name = "ToFile_GoOnIf_RadioButton";
		this.ToFile_GoOnIf_RadioButton.TabStop = true;
		this.ToFile_GoOnIf_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.ToFile_WriteBytes_RadioButton, "ToFile_WriteBytes_RadioButton");
		this.ToFile_WriteBytes_RadioButton.Name = "ToFile_WriteBytes_RadioButton";
		this.ToFile_WriteBytes_RadioButton.TabStop = true;
		this.ToFile_WriteBytes_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.ToFile_WriteBytes_NumericUpDown, "ToFile_WriteBytes_NumericUpDown");
		this.ToFile_WriteBytes_NumericUpDown.Maximum = new decimal(new int[4] { 999, 0, 0, 0 });
		this.ToFile_WriteBytes_NumericUpDown.Minimum = new decimal(new int[4] { 1, 0, 0, 0 });
		this.ToFile_WriteBytes_NumericUpDown.Name = "ToFile_WriteBytes_NumericUpDown";
		this.ToFile_WriteBytes_NumericUpDown.Value = new decimal(new int[4] { 1, 0, 0, 0 });
		resources.ApplyResources(this.ToFile_WriteWith_CM_RadioButton, "ToFile_WriteWith_CM_RadioButton");
		this.ToFile_WriteWith_CM_RadioButton.Name = "ToFile_WriteWith_CM_RadioButton";
		this.ToFile_WriteWith_CM_RadioButton.TabStop = true;
		this.ToFile_WriteWith_CM_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.ToFile_GoOnIf_TextBox, "ToFile_GoOnIf_TextBox");
		this.ToFile_GoOnIf_TextBox.Name = "ToFile_GoOnIf_TextBox";
		resources.ApplyResources(this.ToFile_WriteWith_SP_TextBox, "ToFile_WriteWith_SP_TextBox");
		this.ToFile_WriteWith_SP_TextBox.Name = "ToFile_WriteWith_SP_TextBox";
		this.ToFile_WriteWith_CM_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.ToFile_WriteWith_CM_ComboBox, "ToFile_WriteWith_CM_ComboBox");
		this.ToFile_WriteWith_CM_ComboBox.Name = "ToFile_WriteWith_CM_ComboBox";
		resources.ApplyResources(this.MB2_Label, "MB2_Label");
		this.MB2_Label.Name = "MB2_Label";
		resources.ApplyResources(this.ToFile_NoSave_RadioButton, "ToFile_NoSave_RadioButton");
		this.ToFile_NoSave_RadioButton.Name = "ToFile_NoSave_RadioButton";
		this.ToFile_NoSave_RadioButton.TabStop = true;
		this.ToFile_NoSave_RadioButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.CancelButton = this.cancelButton;
		base.Controls.Add(this.H1_SplitContainer);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "TXTEditorForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(TXTEditorForm_Load);
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		this.H1_SplitContainer.Panel1.ResumeLayout(false);
		this.H1_SplitContainer.Panel1.PerformLayout();
		this.H1_SplitContainer.Panel2.ResumeLayout(false);
		this.H1_SplitContainer.ResumeLayout(false);
		this.H2_SplitContainer.Panel1.ResumeLayout(false);
		this.H2_SplitContainer.Panel1.PerformLayout();
		this.H2_SplitContainer.Panel2.ResumeLayout(false);
		this.H2_SplitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.ptc_DataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ptc_BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ptc_BindingNavigator).EndInit();
		this.ptc_BindingNavigator.ResumeLayout(false);
		this.ptc_BindingNavigator.PerformLayout();
		this.ptc_TableLayoutPanel.ResumeLayout(false);
		this.FromToFile_CM_Panel.ResumeLayout(false);
		this.FromToFile_CM_Panel.PerformLayout();
		this.Table_No_Panel.ResumeLayout(false);
		this.Table_No_Panel.PerformLayout();
		this.FromFile_R_Panel.ResumeLayout(false);
		this.FromFile_R_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.FromFile_ReadBytes_NumericUpDown).EndInit();
		this.FromFile_W_Panel.ResumeLayout(false);
		this.FromFile_W_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.fileTask_Content_BindingSource1).EndInit();
		this.ToFile_R_Panel.ResumeLayout(false);
		this.ToFile_R_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.fileTask_Content_BindingSource2).EndInit();
		this.ToFile_W_Panel.ResumeLayout(false);
		this.ToFile_W_Panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.ToFile_WriteBytes_NumericUpDown).EndInit();
		base.ResumeLayout(false);
	}
}
