using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class ManagerForm : Form
{
	private string[] args;

	private string CurrentPath;

	private string ConfigPath;

	private IContainer components;

	private Button addButton;

	private Button selButton;

	private Button delButton;

	public TextBox passTextBox;

	public TextBox nameTextBox;

	private ECSDataSet eCSDataSet;

	private ComboBox fileComboBox;

	private Label passLabel;

	private Label nameLabel;

	private Label dataLabel;

	public CheckBox ADF_CheckBox;

	public ManagerForm(string[] args)
	{
		InitializeComponent();
		this.args = args;
	}

	private void CreateMDB(string newname)
	{
		if (File.Exists(CurrentPath + "_ECS.mdb"))
		{
			File.Copy(CurrentPath + "_ECS.mdb", CurrentPath + newname + ".mdb");
		}
		else
		{
			File.Copy(ConfigPath + "_ECS.mdb", CurrentPath + newname + ".mdb");
		}
		File.Create(CurrentPath + newname + ".sbp").Close();
		int selectedIndex = fileComboBox.Items.Add(newname);
		fileComboBox.SelectedIndex = selectedIndex;
	}

	private void ManagerForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Login");
		addButton.Text = Program.GetLang("pw_AddNew");
		dataLabel.Text = Program.GetLang("pw_DataFile");
		delButton.Text = Program.GetLang("pw_Delete");
		nameLabel.Text = Program.GetLang("pw_User");
		passLabel.Text = Program.GetLang("pw_Password");
		selButton.Text = Program.GetLang("pw_Login");
		ADF_CheckBox.Text = Program.GetLang("pw_AdvancedSetting");
		Font = Settings.Default.CustomFont;
		ConfigPath = Application.StartupPath + "\\Config\\";
		CurrentPath = Application.StartupPath + "\\Config\\" + Settings.Default.configFolder + "\\";
		DirectoryInfo directoryInfo = new DirectoryInfo(CurrentPath);
		ADF_CheckBox.Visible = Settings.Default.Enable_AdvancedSetting;
		fileComboBox.BeginUpdate();
		FileInfo[] files = directoryInfo.GetFiles("*.mdb");
		foreach (FileInfo fileInfo in files)
		{
			string text = fileInfo.Name.Replace(".mdb", "");
			if (text != "_ECS")
			{
				int selectedIndex = fileComboBox.Items.Add(text);
				if (Settings.Default.fileName == text)
				{
					fileComboBox.SelectedIndex = selectedIndex;
				}
			}
		}
		if (fileComboBox.Items.Count == 0)
		{
			CreateMDB(Program.GetLang("pw_Default"));
		}
		fileComboBox.EndUpdate();
		if (fileComboBox.Items.Count > 0 && fileComboBox.SelectedIndex < 0)
		{
			fileComboBox.SelectedIndex = 0;
		}
		UpdateUI();
		for (int j = 0; j < args.Length; j++)
		{
			string[] array = args[j].Split('|');
			if (array.Length >= 1 && string.Compare(array[0], "-L", ignoreCase: true) == 0)
			{
				if (array.Length >= 3)
				{
					nameTextBox.Text = array[1];
					passTextBox.Text = array[2];
				}
				string filename = fileComboBox.Text;
				if (CheckRight(warnning: false))
				{
					ChangeFilename(filename);
					base.DialogResult = DialogResult.OK;
				}
			}
		}
		base.Icon = new Icon(Application.StartupPath + "\\Resources\\logo.ico");
	}

	private void addButton_Click(object sender, EventArgs e)
	{
		string empty = string.Empty;
		using (InputForm inputForm = new InputForm())
		{
			if (inputForm.ShowDialog(this) != DialogResult.OK || inputForm.inputTextBox.Text == "_ECS" || inputForm.inputTextBox.Text.Length == 0)
			{
				return;
			}
			empty = inputForm.inputTextBox.Text;
		}
		if (MessageBox.Show(this, string.Format(Program.GetLang("pw_Add_0__"), empty), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
		{
			_ = Application.StartupPath + "\\Config\\" + Settings.Default.configFolder + "\\";
			try
			{
				CreateMDB(empty);
				UpdateUI();
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void UpdateUI()
	{
		int count = fileComboBox.Items.Count;
		selButton.Enabled = count > 0;
		delButton.Enabled = count > 1 && fileComboBox.Text != Settings.Default.fileName;
	}

	private bool CheckRight(bool warnning)
	{
		string fileName = Settings.Default.fileName;
		string text;
		string text2;
		using (PasswordTableAdapter passwordTableAdapter = new PasswordTableAdapter())
		{
			try
			{
				passwordTableAdapter.Fill(eCSDataSet.Password);
				ECSDataSet.PasswordRow passwordRow = eCSDataSet.Password.FindByID(0);
				text = passwordRow.Pass;
				passwordRow = eCSDataSet.Password.FindByID(1);
				text2 = passwordRow.Pass;
			}
			catch (Exception)
			{
				text = (text2 = "showmethemoney");
			}
		}
		int num;
		using (PasswordTableAdapter passwordTableAdapter2 = new PasswordTableAdapter())
		{
			try
			{
				passwordTableAdapter2.Fill(eCSDataSet.Password);
				ECSDataSet.PasswordRow passwordRow2 = eCSDataSet.Password.FindByID(-1);
				num = Program.ParseInt(passwordRow2.Pass);
			}
			catch (Exception)
			{
				num = -1;
			}
		}
		if (num != Program.VALIDCHECK_Database)
		{
			MessageBox.Show(this, Program.GetLang("pw_MDBerrororversionnotcompatibility"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			ChangeFilename(fileName);
			return false;
		}
		if (nameTextBox.Text.ToLower() == "admin" && passTextBox.Text == text)
		{
			Program.right = Program.Right.Admin;
		}
		else if (nameTextBox.Text.ToLower() == "user" && passTextBox.Text == text2)
		{
			Program.right = Program.Right.User;
		}
		else
		{
			if (!(nameTextBox.Text.ToLower() == "superadmin") || !(passTextBox.Text.ToLower() == "showmethemoney"))
			{
				if (warnning)
				{
					MessageBox.Show(this, Program.GetLang("pw_PasswordError"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				}
				ChangeFilename(fileName);
				return false;
			}
			Program.right = Program.Right.SuperAdmin;
		}
		return true;
	}

	private static void ChangeFilename(string filename)
	{
		if (filename.Length != 0)
		{
			Settings.Default.fileName = filename;
			Settings.Default.Save();
			string text = $"{Application.StartupPath}\\Config\\{Settings.Default.configFolder}\\{Settings.Default.fileName}.mdb";
			string text2 = $"{Application.StartupPath}\\Config\\{Settings.Default.configFolder}\\{Settings.Default.fileName}.sbp";
			string destFileName = Application.StartupPath + "\\ECS.mdb";
			string destFileName2 = Application.StartupPath + "\\ECS.sbp";
			if (File.Exists(text))
			{
				File.Copy(text, destFileName, overwrite: true);
				if (!File.Exists(text2))
				{
					File.Create(text2).Close();
				}
				File.Copy(text2, destFileName2, overwrite: true);
			}
		}
		else
		{
			string text3 = $"{Application.StartupPath}\\Config\\_ECS.mdb";
			string destFileName3 = Application.StartupPath + "\\ECS.mdb";
			if (File.Exists(text3))
			{
				File.Copy(text3, destFileName3, overwrite: true);
			}
		}
	}

	private void selButton_Click(object sender, EventArgs e)
	{
		if (fileComboBox.SelectedIndex != -1)
		{
			string filename = fileComboBox.Text;
			if (CheckRight(warnning: true))
			{
				ChangeFilename(filename);
				base.DialogResult = DialogResult.OK;
			}
			else
			{
				passTextBox.Text = string.Empty;
				passTextBox.Focus();
			}
		}
	}

	private void delButton_Click(object sender, EventArgs e)
	{
		if (fileComboBox.SelectedIndex == -1)
		{
			return;
		}
		string text = fileComboBox.Text;
		if (MessageBox.Show(this, string.Format(Program.GetLang("pw_Delete_0__"), text), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes)
		{
			return;
		}
		string text2 = Application.StartupPath + "\\Config\\" + Settings.Default.configFolder + "\\";
		try
		{
			File.Delete(text2 + text + ".mdb");
			File.Delete(text2 + text + ".sbp");
			int selectedIndex = fileComboBox.SelectedIndex;
			if (selectedIndex >= 0 && selectedIndex < fileComboBox.Items.Count)
			{
				fileComboBox.Items.RemoveAt(selectedIndex);
				fileComboBox.SelectedIndex = ((selectedIndex > 0) ? (selectedIndex - 1) : 0);
				UpdateUI();
			}
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void fileComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		UpdateUI();
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.ManagerForm));
		this.passLabel = new System.Windows.Forms.Label();
		this.nameLabel = new System.Windows.Forms.Label();
		this.dataLabel = new System.Windows.Forms.Label();
		this.addButton = new System.Windows.Forms.Button();
		this.selButton = new System.Windows.Forms.Button();
		this.delButton = new System.Windows.Forms.Button();
		this.passTextBox = new System.Windows.Forms.TextBox();
		this.nameTextBox = new System.Windows.Forms.TextBox();
		this.eCSDataSet = new ECS.ECSDataSet();
		this.fileComboBox = new System.Windows.Forms.ComboBox();
		this.ADF_CheckBox = new System.Windows.Forms.CheckBox();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		base.SuspendLayout();
		resources.ApplyResources(this.passLabel, "passLabel");
		this.passLabel.Name = "passLabel";
		resources.ApplyResources(this.nameLabel, "nameLabel");
		this.nameLabel.Name = "nameLabel";
		resources.ApplyResources(this.dataLabel, "dataLabel");
		this.dataLabel.Name = "dataLabel";
		resources.ApplyResources(this.addButton, "addButton");
		this.addButton.Name = "addButton";
		this.addButton.UseVisualStyleBackColor = true;
		this.addButton.Click += new System.EventHandler(addButton_Click);
		resources.ApplyResources(this.selButton, "selButton");
		this.selButton.Name = "selButton";
		this.selButton.UseVisualStyleBackColor = true;
		this.selButton.Click += new System.EventHandler(selButton_Click);
		resources.ApplyResources(this.delButton, "delButton");
		this.delButton.Name = "delButton";
		this.delButton.UseVisualStyleBackColor = true;
		this.delButton.Click += new System.EventHandler(delButton_Click);
		resources.ApplyResources(this.passTextBox, "passTextBox");
		this.passTextBox.Name = "passTextBox";
		resources.ApplyResources(this.nameTextBox, "nameTextBox");
		this.nameTextBox.Name = "nameTextBox";
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.fileComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		resources.ApplyResources(this.fileComboBox, "fileComboBox");
		this.fileComboBox.Name = "fileComboBox";
		this.fileComboBox.SelectedIndexChanged += new System.EventHandler(fileComboBox_SelectedIndexChanged);
		resources.ApplyResources(this.ADF_CheckBox, "ADF_CheckBox");
		this.ADF_CheckBox.Name = "ADF_CheckBox";
		this.ADF_CheckBox.UseVisualStyleBackColor = true;
		base.AcceptButton = this.selButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.ADF_CheckBox);
		base.Controls.Add(this.dataLabel);
		base.Controls.Add(this.fileComboBox);
		base.Controls.Add(this.passLabel);
		base.Controls.Add(this.nameLabel);
		base.Controls.Add(this.nameTextBox);
		base.Controls.Add(this.passTextBox);
		base.Controls.Add(this.delButton);
		base.Controls.Add(this.selButton);
		base.Controls.Add(this.addButton);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "ManagerForm";
		base.Load += new System.EventHandler(ManagerForm_Load);
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
