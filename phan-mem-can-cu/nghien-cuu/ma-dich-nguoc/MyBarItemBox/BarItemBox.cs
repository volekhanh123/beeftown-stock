using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS;
using ECS.Properties;

namespace MyBarItemBox;

public class BarItemBox : UserControl
{
	private class SimComboVD_No
	{
		private int value;

		private string display;

		public int Value
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

	public delegate void BtnClickHandle(object sender, EventArgs e);

	private int ctSource;

	private SimComboVD_No[] ctC3;

	private SimComboVD_No[] SimCombo_AllText;

	private SimComboVD_No[] SimCombo_AllSymbol;

	private IContainer components;

	private NumericUpDown N3_NumericUpDown;

	private ComboBox Source_ComboBox;

	private NumericUpDown N2_NumericUpDown;

	private ComboBox C2_ComboBox;

	private ComboBox N4_ComboBox;

	private ComboBox C3_ComboBox;

	private NumericUpDown S2_NumericUpDown;

	private TextBox T2_TextBox;

	private BindingSource barcodeSourceBindingSource1;

	private UIDataSet uIDataSet;

	private BindingSource barcodeOverBindingSource1;

	private Label N2_Label;

	private Label N4_Label;

	private Label N3_Label;

	private Label C3_Label;

	private Label C2_Label;

	private Label S2_Label;

	private Label T2_Label;

	private Label Result_Label;

	private Label Source_Label;

	private Label O3_Label;

	private Label O2_Label;

	private TextBox OT2_TextBox;

	private TextBox OT3_TextBox;

	public event BtnClickHandle UserControlBtnClicked;

	private void C2_ComboBox_SelectedIndexChanged()
	{
		int selectedIndex = C3_ComboBox.SelectedIndex;
		if ((int)Source_ComboBox.SelectedValue == -1)
		{
			string text = ((C2_ComboBox.SelectedIndex == 0) ? uIDataSet.SimCombo.FindByName("PLU Text").ValueDisplay : ((C2_ComboBox.SelectedIndex == 1) ? uIDataSet.SimCombo.FindByName("Global Text").ValueDisplay : ((C2_ComboBox.SelectedIndex == 2) ? uIDataSet.SimCombo.FindByName("Print Format Text").ValueDisplay : ((C2_ComboBox.SelectedIndex != 3) ? "" : uIDataSet.SimCombo.FindByName("BOther Text").ValueDisplay))));
			string[] array = text.Split('|');
			ctC3 = new SimComboVD_No[array.Length / 2];
			for (int i = 0; i < array.Length / 2; i++)
			{
				SimComboVD_No simComboVD_No = new SimComboVD_No();
				simComboVD_No.Value = int.Parse(array[i * 2]);
				simComboVD_No.Display = array[i * 2 + 1];
				ctC3[i] = simComboVD_No;
			}
			C3_ComboBox.DataSource = ctC3;
		}
		else if ((int)Source_ComboBox.SelectedValue == -4)
		{
			string text2 = ((C2_ComboBox.SelectedIndex == 0) ? uIDataSet.SimCombo.FindByName("Symbol Area").ValueDisplay : ((C2_ComboBox.SelectedIndex == 1) ? uIDataSet.SimCombo.FindByName("Symbol Checksum").ValueDisplay : ((C2_ComboBox.SelectedIndex != 2) ? "" : uIDataSet.SimCombo.FindByName("Symbol Unreadable").ValueDisplay)));
			string[] array2 = text2.Split('|');
			ctC3 = new SimComboVD_No[array2.Length / 2];
			for (int j = 0; j < array2.Length / 2; j++)
			{
				SimComboVD_No simComboVD_No2 = new SimComboVD_No();
				simComboVD_No2.Value = int.Parse(array2[j * 2]);
				simComboVD_No2.Display = array2[j * 2 + 1];
				ctC3[j] = simComboVD_No2;
			}
			C3_ComboBox.DataSource = ctC3;
		}
		C3_ComboBox.SelectedIndex = selectedIndex;
	}

	private void C2_ComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		C2_ComboBox_SelectedIndexChanged();
	}

	private void Source_ComboBox_SelectedIndexChanged()
	{
		try
		{
			Label c2_Label = C2_Label;
			Label c3_Label = C3_Label;
			ComboBox c2_ComboBox = C2_ComboBox;
			bool flag = (C3_ComboBox.Visible = (int)Source_ComboBox.SelectedValue == -1 || (int)Source_ComboBox.SelectedValue == -4);
			bool flag3 = (c2_ComboBox.Visible = flag);
			bool visible = (c3_Label.Visible = flag3);
			c2_Label.Visible = visible;
			if ((int)Source_ComboBox.SelectedValue == -1)
			{
				C2_ComboBox.DataSource = SimCombo_AllText;
			}
			if ((int)Source_ComboBox.SelectedValue == -4)
			{
				C2_ComboBox.DataSource = SimCombo_AllSymbol;
			}
			Label s2_Label = S2_Label;
			bool visible2 = (S2_NumericUpDown.Visible = (int)Source_ComboBox.SelectedValue == -2);
			s2_Label.Visible = visible2;
			Label t2_Label = T2_Label;
			bool visible3 = (T2_TextBox.Visible = (int)Source_ComboBox.SelectedValue == -3);
			t2_Label.Visible = visible3;
			Label n2_Label = N2_Label;
			Label n3_Label = N3_Label;
			Label n4_Label = N4_Label;
			NumericUpDown n2_NumericUpDown = N2_NumericUpDown;
			NumericUpDown n3_NumericUpDown = N3_NumericUpDown;
			bool flag8 = (N4_ComboBox.Visible = ((int)Source_ComboBox.SelectedValue >= 1 && (int)Source_ComboBox.SelectedValue <= 29) || (int)Source_ComboBox.SelectedValue == 38 || (int)Source_ComboBox.SelectedValue >= 40);
			bool flag10 = (n3_NumericUpDown.Visible = flag8);
			bool flag12 = (n2_NumericUpDown.Visible = flag10);
			bool flag14 = (n4_Label.Visible = flag12);
			bool visible4 = (n3_Label.Visible = flag14);
			n2_Label.Visible = visible4;
			OT2_TextBox.Visible = false;
			OT3_TextBox.Visible = false;
			if ((int)Source_ComboBox.SelectedValue == 39)
			{
				Label o2_Label = O2_Label;
				bool visible5 = (O3_Label.Visible = true);
				o2_Label.Visible = visible5;
				string[] array = ((UIDataSet.Barcode_SourceRow)((DataRowView)Source_ComboBox.SelectedItem).Row).Display.Split(':');
				if (array.Length >= 2)
				{
					string[] array2 = array[1].Split('|');
					O2_Label.Text = array2[0];
					OT2_TextBox.Visible = true;
					if (array2.Length >= 2)
					{
						O3_Label.Text = array2[1];
						OT3_TextBox.Visible = true;
					}
				}
				if (OT2_TextBox.Text.Length != 1)
				{
					OT2_TextBox.Text = "0";
				}
				if (OT3_TextBox.Text.Length != 1)
				{
					OT3_TextBox.Text = "0";
				}
			}
			else
			{
				Label o2_Label2 = O2_Label;
				bool visible6 = (O3_Label.Visible = false);
				o2_Label2.Visible = visible6;
			}
		}
		catch
		{
		}
	}

	private void Source_ComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		try
		{
			ctSource = (int)Source_ComboBox.SelectedValue;
			Result_Label.Text = StringOut();
			Source_ComboBox_SelectedIndexChanged();
			if (this.UserControlBtnClicked != null)
			{
				this.UserControlBtnClicked(sender, new EventArgs());
			}
		}
		catch
		{
		}
	}

	public bool NewVersionOnly()
	{
		if (ctSource > -3)
		{
			return ctSource >= 26;
		}
		return true;
	}

	public BarItemBox(string a0, string a1, string a2, string a3, string a4, string a5, string a6, string a7)
	{
		InitializeComponent();
		C2_Label.Text = a0;
		C3_Label.Text = a1;
		N2_Label.Text = a2;
		N3_Label.Text = a3;
		N4_Label.Text = a4;
		S2_Label.Text = a5;
		Source_Label.Text = a6;
		T2_Label.Text = a7;
		Source_ComboBox.SelectedValue = 0;
		N2_NumericUpDown.Value = 0m;
		N3_NumericUpDown.Value = 0m;
		N4_ComboBox.SelectedValue = 0;
		string fileName = Application.StartupPath + "\\Combo.xml";
		uIDataSet.ReadXml(fileName);
		string[] array = uIDataSet.SimCombo.FindByName("All Text").ValueDisplay.Split('|');
		SimCombo_AllText = new SimComboVD_No[array.Length / 2];
		for (int i = 0; i < array.Length / 2; i++)
		{
			SimComboVD_No simComboVD_No = new SimComboVD_No
			{
				Value = int.Parse(array[i * 2]),
				Display = array[i * 2 + 1]
			};
			SimCombo_AllText[i] = simComboVD_No;
		}
		array = uIDataSet.SimCombo.FindByName("All Symbol").ValueDisplay.Split('|');
		SimCombo_AllSymbol = new SimComboVD_No[array.Length / 2];
		for (int j = 0; j < array.Length / 2; j++)
		{
			SimComboVD_No simComboVD_No2 = new SimComboVD_No
			{
				Value = int.Parse(array[j * 2]),
				Display = array[j * 2 + 1]
			};
			SimCombo_AllSymbol[j] = simComboVD_No2;
		}
		C2_ComboBox.ValueMember = "Value";
		C2_ComboBox.DisplayMember = "Display";
		C3_ComboBox.ValueMember = "Value";
		C3_ComboBox.DisplayMember = "Display";
	}

	public void BarInit(ref string Sin)
	{
		StringIn(ref Sin);
		Source_ComboBox_SelectedIndexChanged();
		C2_ComboBox_SelectedIndexChanged();
	}

	private bool StringIn_Ori(ref string Sin)
	{
		if (Sin.Length <= 2)
		{
			return false;
		}
		char[] array = Sin.ToCharArray(0, Sin.Length);
		if (array[0] == '>')
		{
			int num = Sin.IndexOf("\v");
			if (num == -1)
			{
				return false;
			}
			Source_ComboBox.SelectedValue = -3;
			T2_TextBox.Text = Sin.Substring(1, num - 1);
			Sin = Sin.Substring(num + 1);
			return true;
		}
		if (array[0] == '?')
		{
			try
			{
				S2_NumericUpDown.Value = Convert.ToInt32(Sin.Substring(1, 3));
			}
			catch (Exception)
			{
				return false;
			}
			Source_ComboBox.SelectedValue = -2;
			Sin = Sin.Substring(4);
			return true;
		}
		if (array[0] == '@' || array[0] == '=')
		{
			if (array[0] == '@')
			{
				Source_ComboBox.SelectedValue = -1;
			}
			else if (array[0] == '=')
			{
				Source_ComboBox.SelectedValue = -4;
			}
			try
			{
				C2_ComboBox.SelectedIndex = Convert.ToInt32(Sin.Substring(1, 1));
				C3_ComboBox.SelectedIndex = Convert.ToInt32(Sin.Substring(2, 2));
			}
			catch (Exception)
			{
				Sin = Sin.Substring(4);
				return true;
			}
			Sin = Sin.Substring(4);
			return true;
		}
		int i = 0;
		int num2 = 0;
		for (; array[i] >= 'A' && array[i] <= 'Z'; i++)
		{
			num2 = num2 * 26 + (array[i] - 65);
		}
		if (i == 0)
		{
			return false;
		}
		try
		{
			if (num2 == 39)
			{
				if (Sin.Substring(i, 1) == "-")
				{
					OT2_TextBox.Text = Sin.Substring(i + 1, 1);
					OT3_TextBox.Text = Sin.Substring(i + 2, 1);
				}
				else
				{
					OT2_TextBox.Text = Sin.Substring(i, 1);
					OT3_TextBox.Text = Sin.Substring(i + 1, 1);
				}
			}
			else
			{
				N2_NumericUpDown.Value = Convert.ToInt32(Sin.Substring(i, 1));
				N3_NumericUpDown.Value = Convert.ToInt32(Sin.Substring(i + 1, 1));
				N4_ComboBox.SelectedValue = Convert.ToInt32(Sin.Substring(i + 2, 1));
			}
		}
		catch (Exception)
		{
			return false;
		}
		Source_ComboBox.SelectedValue = num2;
		Sin = Sin.Substring(i + 3);
		return true;
	}

	public bool StringIn(ref string Sin)
	{
		bool flag = StringIn_Ori(ref Sin);
		if (!flag)
		{
			Source_ComboBox.SelectedValue = 0;
			N2_NumericUpDown.Value = 0m;
			N3_NumericUpDown.Value = 0m;
			N4_ComboBox.SelectedValue = 0;
		}
		return flag;
	}

	public string StringOut()
	{
		if ((int)Source_ComboBox.SelectedValue == -3)
		{
			return '>' + T2_TextBox.Text + '\v';
		}
		if ((int)Source_ComboBox.SelectedValue == -2)
		{
			return '?' + S2_NumericUpDown.Value.ToString("000");
		}
		if ((int)Source_ComboBox.SelectedValue == -1)
		{
			return '@' + C2_ComboBox.SelectedIndex.ToString("0") + C3_ComboBox.SelectedIndex.ToString("00");
		}
		if ((int)Source_ComboBox.SelectedValue == -4)
		{
			return '=' + C2_ComboBox.SelectedIndex.ToString("0") + C3_ComboBox.SelectedIndex.ToString("00");
		}
		if ((int)Source_ComboBox.SelectedValue == 0)
		{
			return "A000";
		}
		if ((int)Source_ComboBox.SelectedValue > 0)
		{
			string text = "";
			int num = (int)Source_ComboBox.SelectedValue;
			do
			{
				text = (char)(65 + num % 26) + text;
				num /= 26;
			}
			while (num > 0);
			if ((int)Source_ComboBox.SelectedValue == 39)
			{
				char c = ((OT2_TextBox.Text.Length != 0) ? OT2_TextBox.Text.ToCharArray(0, 1)[0] : '0');
				char c2 = ((OT3_TextBox.Text.Length != 0) ? OT3_TextBox.Text.ToCharArray(0, 1)[0] : '0');
				if (c >= '0' && c <= '9')
				{
					return text + c + c2 + '0';
				}
				return text + '-' + c + c2;
			}
			return text + N2_NumericUpDown.Value.ToString("0") + N3_NumericUpDown.Value.ToString("0") + N4_ComboBox.SelectedIndex.ToString("0");
		}
		return "";
	}

	public int GetN1()
	{
		return (int)Source_ComboBox.SelectedValue;
	}

	public int GetN2()
	{
		return (int)N2_NumericUpDown.Value;
	}

	private void Source_ComboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView == null)
		{
			return;
		}
		string text = "";
		int num = (int)dataRowView["Value"];
		if (num < 0)
		{
			text += (char)(65 + num);
		}
		else
		{
			do
			{
				text = (char)(65 + num % 26) + text;
				num /= 26;
			}
			while (num != 0);
		}
		e.Value = string.Format("{0}: {1}", text, dataRowView["Display"]);
	}

	private void BarItemBox_Load(object sender, EventArgs e)
	{
	}

	private void OT2_TextBox_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == '\b' || e.KeyChar == '\u001b')
		{
			OT2_TextBox.Text = "0";
			e.KeyChar = '\0';
			e.Handled = true;
		}
		else
		{
			OT2_TextBox.Text = string.Concat(e.KeyChar);
			e.KeyChar = '\0';
			e.Handled = true;
		}
	}

	private void OT3_TextBox_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == '\b' || e.KeyChar == '\u001b')
		{
			OT3_TextBox.Text = "0";
			e.KeyChar = '\0';
			e.Handled = true;
		}
		else
		{
			OT3_TextBox.Text = string.Concat(e.KeyChar);
			e.KeyChar = '\0';
			e.Handled = true;
		}
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(MyBarItemBox.BarItemBox));
		this.Source_Label = new System.Windows.Forms.Label();
		this.N4_Label = new System.Windows.Forms.Label();
		this.N3_Label = new System.Windows.Forms.Label();
		this.N2_Label = new System.Windows.Forms.Label();
		this.C3_Label = new System.Windows.Forms.Label();
		this.C2_Label = new System.Windows.Forms.Label();
		this.S2_Label = new System.Windows.Forms.Label();
		this.T2_Label = new System.Windows.Forms.Label();
		this.N3_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Source_ComboBox = new System.Windows.Forms.ComboBox();
		this.barcodeSourceBindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.uIDataSet = new ECS.UIDataSet();
		this.N2_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.C2_ComboBox = new System.Windows.Forms.ComboBox();
		this.N4_ComboBox = new System.Windows.Forms.ComboBox();
		this.barcodeOverBindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.C3_ComboBox = new System.Windows.Forms.ComboBox();
		this.S2_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.T2_TextBox = new System.Windows.Forms.TextBox();
		this.Result_Label = new System.Windows.Forms.Label();
		this.O3_Label = new System.Windows.Forms.Label();
		this.O2_Label = new System.Windows.Forms.Label();
		this.OT2_TextBox = new System.Windows.Forms.TextBox();
		this.OT3_TextBox = new System.Windows.Forms.TextBox();
		((System.ComponentModel.ISupportInitialize)this.N3_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeSourceBindingSource1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.N2_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeOverBindingSource1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.S2_NumericUpDown).BeginInit();
		base.SuspendLayout();
		resources.ApplyResources(this.Source_Label, "Source_Label");
		this.Source_Label.Name = "Source_Label";
		resources.ApplyResources(this.N4_Label, "N4_Label");
		this.N4_Label.Name = "N4_Label";
		resources.ApplyResources(this.N3_Label, "N3_Label");
		this.N3_Label.Name = "N3_Label";
		resources.ApplyResources(this.N2_Label, "N2_Label");
		this.N2_Label.Name = "N2_Label";
		resources.ApplyResources(this.C3_Label, "C3_Label");
		this.C3_Label.Name = "C3_Label";
		resources.ApplyResources(this.C2_Label, "C2_Label");
		this.C2_Label.Name = "C2_Label";
		resources.ApplyResources(this.S2_Label, "S2_Label");
		this.S2_Label.Name = "S2_Label";
		resources.ApplyResources(this.T2_Label, "T2_Label");
		this.T2_Label.Name = "T2_Label";
		resources.ApplyResources(this.N3_NumericUpDown, "N3_NumericUpDown");
		this.N3_NumericUpDown.Maximum = ECS.Properties.Settings.Default.maxBarcodeShift;
		this.N3_NumericUpDown.Name = "N3_NumericUpDown";
		this.N3_NumericUpDown.ValueChanged += new System.EventHandler(Source_ComboBox_SelectedIndexChanged);
		this.Source_ComboBox.DataSource = this.barcodeSourceBindingSource1;
		this.Source_ComboBox.DisplayMember = "Display";
		this.Source_ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.Source_ComboBox.DropDownWidth = 200;
		this.Source_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.Source_ComboBox, "Source_ComboBox");
		this.Source_ComboBox.Name = "Source_ComboBox";
		this.Source_ComboBox.ValueMember = "Value";
		this.Source_ComboBox.SelectedIndexChanged += new System.EventHandler(Source_ComboBox_SelectedIndexChanged);
		this.Source_ComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(Source_ComboBox_Format);
		this.barcodeSourceBindingSource1.DataMember = "Barcode_Source";
		this.barcodeSourceBindingSource1.DataSource = this.uIDataSet;
		this.barcodeSourceBindingSource1.Filter = "[Display] <> '#NULL#'";
		this.barcodeSourceBindingSource1.Sort = "Value";
		this.uIDataSet.DataSetName = "UIDataSet";
		this.uIDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uIDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.N2_NumericUpDown, "N2_NumericUpDown");
		this.N2_NumericUpDown.Maximum = ECS.Properties.Settings.Default.maxBarcodeLength;
		this.N2_NumericUpDown.Name = "N2_NumericUpDown";
		this.N2_NumericUpDown.ValueChanged += new System.EventHandler(Source_ComboBox_SelectedIndexChanged);
		this.C2_ComboBox.DisplayMember = "Display";
		this.C2_ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.C2_ComboBox.DropDownWidth = 200;
		this.C2_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.C2_ComboBox, "C2_ComboBox");
		this.C2_ComboBox.Name = "C2_ComboBox";
		this.C2_ComboBox.ValueMember = "Value";
		this.C2_ComboBox.SelectedIndexChanged += new System.EventHandler(C2_ComboBox_SelectedIndexChanged);
		this.N4_ComboBox.DataSource = this.barcodeOverBindingSource1;
		this.N4_ComboBox.DisplayMember = "Display";
		this.N4_ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.N4_ComboBox.DropDownWidth = 200;
		this.N4_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.N4_ComboBox, "N4_ComboBox");
		this.N4_ComboBox.Name = "N4_ComboBox";
		this.N4_ComboBox.ValueMember = "Value";
		this.N4_ComboBox.SelectedValueChanged += new System.EventHandler(Source_ComboBox_SelectedIndexChanged);
		this.barcodeOverBindingSource1.DataMember = "Barcode_Over";
		this.barcodeOverBindingSource1.DataSource = this.uIDataSet;
		this.barcodeOverBindingSource1.Sort = "Value";
		this.C3_ComboBox.DisplayMember = "Display";
		this.C3_ComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.C3_ComboBox.DropDownWidth = 200;
		this.C3_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.C3_ComboBox, "C3_ComboBox");
		this.C3_ComboBox.Name = "C3_ComboBox";
		this.C3_ComboBox.ValueMember = "Value";
		this.C3_ComboBox.SelectedIndexChanged += new System.EventHandler(Source_ComboBox_SelectedIndexChanged);
		resources.ApplyResources(this.S2_NumericUpDown, "S2_NumericUpDown");
		this.S2_NumericUpDown.Maximum = new decimal(new int[4] { 999, 0, 0, 0 });
		this.S2_NumericUpDown.Name = "S2_NumericUpDown";
		this.S2_NumericUpDown.ValueChanged += new System.EventHandler(Source_ComboBox_SelectedIndexChanged);
		resources.ApplyResources(this.T2_TextBox, "T2_TextBox");
		this.T2_TextBox.Name = "T2_TextBox";
		this.T2_TextBox.TextChanged += new System.EventHandler(Source_ComboBox_SelectedIndexChanged);
		resources.ApplyResources(this.Result_Label, "Result_Label");
		this.Result_Label.Name = "Result_Label";
		resources.ApplyResources(this.O3_Label, "O3_Label");
		this.O3_Label.Name = "O3_Label";
		resources.ApplyResources(this.O2_Label, "O2_Label");
		this.O2_Label.Name = "O2_Label";
		resources.ApplyResources(this.OT2_TextBox, "OT2_TextBox");
		this.OT2_TextBox.Name = "OT2_TextBox";
		this.OT2_TextBox.TextChanged += new System.EventHandler(Source_ComboBox_SelectedIndexChanged);
		this.OT2_TextBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(OT2_TextBox_KeyPress);
		resources.ApplyResources(this.OT3_TextBox, "OT3_TextBox");
		this.OT3_TextBox.Name = "OT3_TextBox";
		this.OT3_TextBox.TextChanged += new System.EventHandler(Source_ComboBox_SelectedIndexChanged);
		this.OT3_TextBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(OT3_TextBox_KeyPress);
		this.BackColor = System.Drawing.SystemColors.Control;
		base.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		base.Controls.Add(this.OT3_TextBox);
		base.Controls.Add(this.OT2_TextBox);
		base.Controls.Add(this.O3_Label);
		base.Controls.Add(this.O2_Label);
		base.Controls.Add(this.Result_Label);
		base.Controls.Add(this.T2_TextBox);
		base.Controls.Add(this.C3_Label);
		base.Controls.Add(this.C3_ComboBox);
		base.Controls.Add(this.C2_Label);
		base.Controls.Add(this.N3_NumericUpDown);
		base.Controls.Add(this.N4_Label);
		base.Controls.Add(this.Source_ComboBox);
		base.Controls.Add(this.S2_NumericUpDown);
		base.Controls.Add(this.N2_NumericUpDown);
		base.Controls.Add(this.N3_Label);
		base.Controls.Add(this.C2_ComboBox);
		base.Controls.Add(this.T2_Label);
		base.Controls.Add(this.N4_ComboBox);
		base.Controls.Add(this.S2_Label);
		base.Controls.Add(this.Source_Label);
		base.Controls.Add(this.N2_Label);
		base.Name = "BarItemBox";
		resources.ApplyResources(this, "$this");
		base.Load += new System.EventHandler(BarItemBox_Load);
		((System.ComponentModel.ISupportInitialize)this.N3_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeSourceBindingSource1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.N2_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.barcodeOverBindingSource1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.S2_NumericUpDown).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
